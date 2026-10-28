#!/usr/bin/env python3
"""stone 第二大脑可移植版。离线、确定性文件操作；不包含 LLM 或网络抓取。"""
from __future__ import annotations
import argparse, contextlib, datetime as dt, hashlib, json, os, re, shutil, sys
from pathlib import Path
try:
    import yaml
except ImportError:
    sys.exit('缺少 PyYAML。先在独立虚拟环境运行 python -m pip install -r requirements.txt')
VERSION = '2.0.0'
TYPES = {'article','video','podcast','pdf','book','course','conversation','twitter','other'}
RETENTION = {'verbatim','procedure','insight'}
BEGIN, END = '<!-- stone:auto:start -->', '<!-- stone:auto:end -->'
def digest(data): return hashlib.sha256(data).hexdigest()
def dump(data): return json.dumps(data, ensure_ascii=False, sort_keys=True)
def fail(message): raise ValueError(message)
def inside(v, relative):
    p = v / relative
    if Path(relative).is_absolute() or '..' in Path(relative).parts or not p.resolve().is_relative_to(v.resolve()): fail('路径超出所选知识库')
    # No symlinks even when they currently resolve inside the vault.
    if any(q.is_symlink() for q in [p,*p.parents] if q.is_relative_to(v)): fail('不允许通过符号链接写入')
    return p

def name(text):
    text = text.strip()
    if not text or len(text)>100 or re.search(r'[\x00-\x1f/\\:*?"<>|\[\]#]',text) or text in {'.','..'}: fail('标题/概念名称含不支持的字符')
    return text

def read_note(p):
    text = p.read_text(encoding='utf-8')
    if not text.startswith('---\n'): fail(f'缺少 YAML 元数据：{p.name}')
    head,sep,body = text[4:].partition('\n---\n')
    if not sep: fail(f'元数据结束标记缺失：{p.name}')
    meta = yaml.safe_load(head)
    if not isinstance(meta,dict): fail('元数据必须是键值表')
    return meta,body

def markdown(meta,body): return '---\n'+yaml.safe_dump(meta,allow_unicode=True,sort_keys=False)+'---\n'+body

def links(body):
    body=re.sub(r'(?ms)^```.*?^```[^\n]*','',body)
    body=re.sub(r'`[^`\n]+`','',body)
    return re.findall(r'\[\[([^\]|#]+)(?:[^\]]*)\]\]',body)

def check_links(v,body,planned=()):
    for target in links(body):
        rel=target if target.endswith('.md') else target+'.md'
        if rel not in planned and not inside(v,rel).is_file(): fail(f'断链：{target}')

def load(v):
    if not inside(v,'.stone.json').exists(): fail('不是 v2 知识库，请先对新空文件夹执行 init')
    return json.loads(inside(v,'Sources/index.json').read_text())

def logs(v):
    data=inside(v,'docs/log.jsonl').read_bytes();previous=b''
    for raw in data.splitlines(keepends=True):
        row=json.loads(raw);actual=row.pop('hash')
        if row['prev']!=digest(previous) or actual!=digest(dump(row).encode()): fail('日志完整性校验失败')
        previous+=raw
    return data

def log_bytes(old,kind,detail):
    row={'time':dt.datetime.now(dt.timezone.utc).isoformat(),'kind':kind,'detail':detail,'prev':digest(old)}
    row['hash']=digest(dump(row).encode());return old+(dump(row)+'\n').encode()

@contextlib.contextmanager
def lock(v):
    p=inside(v,'.stone.lock')
    try: fd=os.open(p,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    except FileExistsError: fail('另一次操作未结束；确认无进程运行后再处理 .stone.lock，勿并发写入')
    os.close(fd)
    try: yield
    finally: p.unlink()

def write_batch(v,changes):
    # Recoverable in-process rollback. Power-loss is detected by check, not promised atomic.
    previous={};written=[]
    try:
        for rel,data in changes.items():
            p=inside(v,rel);previous[rel]=p.read_bytes() if p.exists() else None
            p.parent.mkdir(parents=True,exist_ok=True)
            written.append(rel);p.write_bytes(data if isinstance(data,bytes) else data.encode())
    except Exception:
        for rel in reversed(written):
            p=inside(v,rel)
            if previous[rel] is None:p.unlink(missing_ok=True)
            else:p.write_bytes(previous[rel])
        raise

def managed(v,rel,content):
    text=inside(v,rel).read_text()
    if text.count(BEGIN)!=1 or text.count(END)!=1 or text.index(BEGIN)>text.index(END):fail(f'{rel} 自动区标记缺失/重复，停止以保护人工内容')
    a,rest=text.split(BEGIN);_,b=rest.split(END)
    return a+BEGIN+'\n'+content+'\n'+END+b

def navigation(v,index):
    done=[e for e in index.values() if e.get('note')]
    listing='\n'.join(f'- [[{e["note"][:-3]}|{e["title"]}]]'+''.join(f' · [[Wiki/{w}]]' for w in e.get('wiki',[])) for e in done) or '暂无正式笔记。'
    queue='\n'.join(f'- {"已完成" if e.get("note") else "待审阅"} · {e["title"]} · [[{(e.get("note") or e["draft"])[:-3]}]]' for e in index.values()) or '暂无材料。'
    return {'Notes/index.md':managed(v,'Notes/index.md',listing),'000-首页.md':managed(v,'000-首页.md',listing),'内容入库队列.md':managed(v,'内容入库队列.md',queue)}

def validate(v,index):
    logs(v)
    known=set()
    for sid,e in index.items():
        if e['source_id']!=sid:fail('注册表 ID 不一致')
        raw=inside(v,e['raw'])
        if not raw.is_file() or digest(raw.read_bytes())!=e['sha256']:fail(f'原文缺失或已改动：{e["title"]}')
        if e['source'] in known:fail('同一来源重复登记')
        known.add(e['source'])
        if e.get('note'):
            p=inside(v,e['note']);meta,body=read_note(p)
            required={'schema_version','source','source_id','type','date','tags','wiki_links','retention','raw_page','evidence'}
            if not required<=meta.keys():fail(f'笔记缺元数据：{p.name}')
            if meta['source_id']!=sid or meta['source']!=e['source'] or meta['raw_page']!=e['raw']:fail('笔记与来源映射不一致')
            if meta['retention'] not in RETENTION or meta['type'] not in TYPES:fail('笔记类型不合法')
            validate_evidence(raw,meta)
            check_links(v,body)
            if '#flashcards' in body:fail('不生成记忆卡片')
            for w in e.get('wiki',[]):
                wp=inside(v,'Wiki/'+w+'.md')
                if not wp.exists() or '[['+e['note'][:-3]+']]' not in wp.read_text():fail('Wiki 未反链来源笔记')
    for p in inside(v,'Notes').glob('*.md'):
        if p.name!='index.md' and p.relative_to(v).as_posix() not in {e.get('note') for e in index.values()}:fail('发现未登记的正式笔记')
    for p in inside(v,'Wiki').glob('*.md'):
        meta,body=read_note(p)
        if not meta.get('type') or not meta.get('schema_version'):fail('Wiki 元数据缺失')
        check_links(v,body)
    for rel in ['Notes/index.md','000-首页.md','内容入库队列.md']:
        text=inside(v,rel).read_text();check_links(v,text)
        # Mechanical index drift is not quietly accepted.
        expected=navigation(v,index)[rel]
        if expected!=text:fail(f'导航未同步：{rel}')

def validate_evidence(raw,meta):
    evidence=meta.get('evidence')
    if not isinstance(evidence,list) or not evidence:fail('至少提供一条 claim / quote 证据')
    text=raw.read_text(encoding='utf-8')
    for row in evidence:
        if not isinstance(row,dict) or not str(row.get('claim','')).strip() or not isinstance(row.get('quote'),str) or not row['quote'].strip() or row['quote'] not in text:fail('引用无法在原文逐字找到')

def init(v):
    if v.exists() and any(v.iterdir()):fail('只允许初始化新空文件夹，不覆盖已有知识库')
    v.mkdir(parents=True,exist_ok=True)
    for d in ['Sources/raw','Notes','Wiki','outputs/drafts','outputs/qa','outputs/health','沉淀','docs']: (v/d).mkdir(parents=True,exist_ok=True)
    here=Path(__file__).resolve().parent
    for rel in ['CLAUDE.md','AGENTS.md']:
        shutil.copyfile(here/rel,v/rel)
    for p in (here/'docs').glob('*.md'):shutil.copyfile(p,v/'docs'/p.name)
    shutil.copyfile(Path(__file__).resolve(),v/'brain.py')
    for f in ['requirements.txt']:
        if (here/f).exists():shutil.copyfile(here/f,v/f)
    changes={'.stone.json':dump({'version':VERSION}), 'Sources/index.json':'{}\n','docs/log.jsonl':log_bytes(b'','INIT','新空库'),
      'Notes/index.md':'# 素材库\n\n'+BEGIN+'\n暂无正式笔记。\n'+END+'\n',
      '000-首页.md':'# 我的第二大脑\n\n[操作指南](docs/开始使用.md) · [[Notes/index|素材库]] · [[内容入库队列]]\n\n## 最近入库\n'+BEGIN+'\n暂无正式笔记。\n'+END+'\n\n## 我的想法\n在沉淀目录写下你的判断。\n',
      '内容入库队列.md':'# 内容入库队列\n\n'+BEGIN+'\n暂无材料。\n'+END+'\n'}
    write_batch(v,changes);print('已初始化新库：'+str(v))

def ingest(v,args,index):
    src=Path(args.file).expanduser();data=src.read_bytes()
    try: text=data.decode('utf-8')
    except UnicodeDecodeError:fail('只接收 UTF-8 文字/转录；PDF 和媒体需先提取文字')
    if not text.strip():fail('材料为空')
    title=name(args.title);sha=digest(data);source=args.source or 'sha256:'+sha
    for e in index.values():
        if e['sha256']==sha or e['source']==source:
            if e['sha256']!=sha:fail('同一来源正文已变化；保留旧版，人工决定新版本标识，不覆盖')
            print(dump(e));return
    sid='sha256:'+sha
    key=sha[:16];raw=f'Sources/raw/{key}.md';draft=f'outputs/drafts/{key}.md'
    e={'source_id':sid,'source':source,'sha256':sha,'raw':raw,'draft':draft,'title':title,'language':args.language,'type':args.type,'retention':args.retention}
    meta={'schema_version':2,'source':source,'source_id':sid,'type':args.type,'retention':args.retention,'date':dt.date.today().isoformat(),'tags':[],'wiki_links':[],'raw_page':raw,'evidence':[],'status':'draft'}
    body=f'\n# {title}\n\n来源：[[{raw[:-3]}]]\n\n## 摘要\nTODO\n\n## 核心要点\nTODO\n\n## 值得深挖\nTODO：区分来源观点、AI 推断与局限；没有依据就明确写未知。\n'
    for rel in [raw,draft]:
        if inside(v,rel).exists():fail('目标文件已存在但未登记，停止以保护内容')
    index[sid]=e;changes={raw:data,draft:markdown(meta,body),'Sources/index.json':dump(index)+'\n','docs/log.jsonl':log_bytes(logs(v),'IMPORT',sid)};changes.update(navigation(v,index));write_batch(v,changes);print(dump(e))

def publish(v,args,index):
    if not args.approve or not args.review or not args.review.strip():fail('需要真实用户审阅后的 --approve 和 --review，AI 不得代替用户授权')
    draft=inside(v,args.draft)
    if not draft.is_relative_to(v/'outputs/drafts'):fail('只能确认 outputs/drafts 中的草稿')
    meta,body=read_note(draft);sid=meta.get('source_id');e=index.get(sid)
    if not e or e['draft']!=args.draft:fail('草稿未登记')
    if e.get('note'):print('已入库，未重复写入：'+e['note']);return
    if any(meta.get(k)!=e[k] for k in ['source','source_id','type','retention']) or meta.get('raw_page')!=e['raw']:fail('草稿来源字段被改动')
    required={'schema_version','source','source_id','type','date','tags','wiki_links','retention','raw_page','evidence'}
    if not required<=meta.keys() or meta['schema_version']!=2:fail('草稿缺元数据或 schema_version 不合法')
    if not isinstance(meta['tags'],list) or not isinstance(meta['wiki_links'],list):fail('tags 和 wiki_links 必须是列表')
    try:dt.date.fromisoformat(str(meta['date']))
    except ValueError:fail('date 必须是有效的 YYYY-MM-DD')
    if 'TODO' in body or not all(h in body for h in ['## 摘要','## 核心要点','## 值得深挖']):fail('草稿仍有占位或缺少正文结构')
    if '#flashcards' in body or '#2563eb' in body:fail('草稿不能包含记忆卡片或伪造的蓝色用户观点')
    validate_evidence(inside(v,e['raw']),meta)
    if meta['retention']=='verbatim' and inside(v,e['raw']).read_text() not in body:fail('verbatim 必须在正文完整保留原件')
    wikis=list(dict.fromkeys(name(w) for w in args.wiki));rel='Notes/'+name(e['title'])+'.md'
    if inside(v,rel).exists():fail('正式笔记同名，停止以保护内容')
    planned=[rel]+['Wiki/'+w+'.md' for w in wikis]
    meta.update(status='reviewed',wiki_links=['Wiki/'+w for w in wikis],review=args.review)
    # Quote locations are visible in the final note as well as metadata.
    body+='\n## 核对依据\n'+''.join(f'- {q["claim"]}：原文「{q["quote"]}」\n' for q in meta['evidence'])
    body+='\n## 相关笔记\n'+''.join('[['+'Wiki/'+w+']]\n' for w in wikis)
    check_links(v,body,planned)
    changes={rel:markdown(meta,body)}
    for w in wikis:
        wp='Wiki/'+w+'.md';p=inside(v,wp)
        text=p.read_text() if p.exists() else markdown({'schema_version':1,'type':'concept'},'\n# '+w+'\n\n这是来源索引；定义与综合需阅读全文后另行确认。\n')
        # Append only: never rewrite a user's existing definition.
        text+='\n## 来源 · '+e['title']+'\n[['+rel[:-3]+']] — 主题候选，经本次用户确认关联；不自动断言观点一致。\n'
        check_links(v,text,planned);changes[wp]=text
    e.update(note=rel,wiki=wikis);changes['Sources/index.json']=dump(index)+'\n';changes['docs/log.jsonl']=log_bytes(logs(v),'PUBLISH',sid);changes.update(navigation(v,index));write_batch(v,changes)
    validate(v,index);print('已入库并通过检查：'+rel)

def query(v,args,index):
    terms=[x.lower() for x in re.findall(r'[\w]+',args.question)]
    found=[]
    for e in index.values():
        if not e.get('note'):continue
        text=inside(v,e['note']).read_text();hay=(text+' '+' '.join(e.get('wiki',[]))).lower()
        if any(t in hay for t in terms):found.append({'note':e['note'],'wiki':e.get('wiki',[]),'source_id':e['source_id'],'source':e['source'],'raw':e['raw']})
    print(dump({'mode':'本地关键词证据定位，不是语义搜索或模型答案','results':found,'hint':'无命中时改用一个主题词；打开 raw 完整回查后再回答。'}))

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--vault',default='.');sub=ap.add_subparsers(dest='cmd',required=True)
    sub.add_parser('init');sub.add_parser('doctor');sub.add_parser('check')
    i=sub.add_parser('import');i.add_argument('file');i.add_argument('--title',required=True);i.add_argument('--source');i.add_argument('--language',required=True);i.add_argument('--type',choices=sorted(TYPES),default='article');i.add_argument('--retention',choices=sorted(RETENTION),default='insight')
    p=sub.add_parser('publish');p.add_argument('draft');p.add_argument('--approve',action='store_true');p.add_argument('--review');p.add_argument('--wiki',action='append',default=[])
    q=sub.add_parser('query');q.add_argument('question')
    c=sub.add_parser('compile');c.add_argument('source_id')
    h=sub.add_parser('health');h.add_argument('--write',action='store_true')
    args=ap.parse_args();v=Path(args.vault).expanduser().resolve()
    if args.cmd=='doctor':print(dump({'python':sys.version.split()[0],'pyyaml':yaml.__version__,'version':VERSION,'network':'离线','llm':'需自行配置文件型 AI；脚本不生成摘要'}));return
    if args.cmd=='init':init(v);return
    index=load(v)
    # Read commands never change files. Writers re-read under one exclusive lock.
    if args.cmd in {'import','publish'} or (args.cmd=='health' and args.write):
        with lock(v):
            index=load(v);validate(v,index)
            if args.cmd=='import':ingest(v,args,index)
            elif args.cmd=='publish':publish(v,args,index)
            else:
                stamp=dt.datetime.now().strftime('%Y%m%d-%H%M%S-%f');rel=f'outputs/health/{stamp}.md';write_batch(v,{rel:health(index),'docs/log.jsonl':log_bytes(logs(v),'HEALTH',rel)});print(rel)
        return
    validate(v,index)
    if args.cmd=='check':print('PASS：来源哈希、登记映射、引用、双链、索引、队列、日志完整性')
    elif args.cmd=='query':query(v,args,index)
    elif args.cmd=='compile':
        e=index.get(args.source_id)
        if not e:fail('未登记的 source_id')
        print(dump({'mode':'只读影响分析，不自动改写','source':e['source'],'raw':e['raw'],'note':e.get('note'),'affected_wiki':e.get('wiki',[])}))
    elif args.cmd=='health':print(health(index))

def health(index):
    done=sum(bool(e.get('note')) for e in index.values())
    return f'# 知识库检查\n\n已通过机械完整性检查。\n\n- 来源：{len(index)}\n- 正式笔记：{done}\n- 待审阅：{len(index)-done}\n\n语义准确、步骤完整、观点归属和关联合理性仍需人工审阅。无关联的笔记不强制凑链接。\n'
if __name__=='__main__':
    try:main()
    except (ValueError,OSError,KeyError,TypeError,yaml.YAMLError,json.JSONDecodeError) as e:
        print('ERROR: '+str(e),file=sys.stderr);sys.exit(1)
