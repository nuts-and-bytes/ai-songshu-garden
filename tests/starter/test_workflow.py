"""Public package contract: always use throwaway vaults, never the author's vault."""
import hashlib,json,subprocess,sys,tempfile,unittest
from pathlib import Path
HERE=Path(__file__).resolve()
SCRIPT=(HERE.parents[1]/'brain.py') if (HERE.parents[1]/'brain.py').exists() else HERE.parents[2]/'public/downloads/stone-second-brain/brain.py'
class Workflow(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);self.v=self.root/'空库';self.src=self.root/'原文.txt';self.src.write_text('第一段：原文必须保留。\n第二段：总结需要核对。\n')
 def run_cli(self,*args,ok=True):
  p=subprocess.run([sys.executable,str(SCRIPT),'--vault',str(self.v),*args],capture_output=True,text=True)
  if ok:self.assertEqual(p.returncode,0,p.stderr+p.stdout)
  else:self.assertNotEqual(p.returncode,0,p.stdout)
  return p
 def prepare(self):
  self.run_cli('init');p=self.run_cli('import',str(self.src),'--title','来源核对','--source','https://example.org/article','--language','zh-Hans');return json.loads(p.stdout)
 def ready(self):
  item=self.prepare();draft=self.v/item['draft'];s=draft.read_text().replace('TODO','已核对的内容')
  s=s.replace('evidence: []','evidence:\n- claim: 原文需要保留\n  quote: 原文必须保留。')
  draft.write_text(s);return item
 def test_script_shipped(self):self.assertTrue(SCRIPT.is_file(),'reproducible runtime is missing')
 def test_empty_init_refuses_existing_content(self):
  self.v.mkdir();(self.v/'私人.md').write_text('不可覆盖');self.run_cli('init',ok=False);self.assertEqual((self.v/'私人.md').read_text(),'不可覆盖')
 def test_import_preserves_bytes_and_is_idempotent(self):
  item=self.prepare();before={p.relative_to(self.v).as_posix():p.read_bytes() for p in self.v.rglob('*') if p.is_file()}
  self.assertEqual((self.v/item['raw']).read_bytes(),self.src.read_bytes())
  self.run_cli('import',str(self.src),'--title','另一个标题','--source','https://example.org/article','--language','zh-Hans')
  self.assertEqual(before,{p.relative_to(self.v).as_posix():p.read_bytes() for p in self.v.rglob('*') if p.is_file()})
 def test_publish_requires_approval_and_non_placeholder(self):
  item=self.prepare();self.run_cli('publish',item['draft'],'--wiki','来源追溯',ok=False)
  self.run_cli('publish',item['draft'],'--wiki','来源追溯','--approve','--review','我确认了来源',ok=False)
  self.assertEqual(list((self.v/'Notes').glob('*.md')),[self.v/'Notes/index.md'])
 def test_published_graph_query_index_queue_and_log(self):
  item=self.ready();self.run_cli('publish',item['draft'],'--wiki','来源追溯','--approve','--review','保留原文才方便核对')
  self.run_cli('check');self.run_cli('query','来源追溯');self.run_cli('compile',item['source_id']);self.run_cli('health')
  self.assertIn('[[Wiki/来源追溯]]',(self.v/'Notes/index.md').read_text())
  self.assertIn('已完成',(self.v/'内容入库队列.md').read_text())
  before=(self.v/'Wiki/来源追溯.md').read_text();self.run_cli('publish',item['draft'],'--wiki','来源追溯','--approve','--review','保留原文才方便核对')
  self.assertEqual(before,(self.v/'Wiki/来源追溯.md').read_text())
  raw=self.v/item['raw'];raw.write_text('被改写');self.run_cli('check',ok=False);self.run_cli('query','来源追溯',ok=False)
 def test_bad_quote_and_broken_link_block_publication(self):
  item=self.ready();p=self.v/item['draft'];s=p.read_text();p.write_text(s.replace('原文必须保留。','原文说一切都正确。'));self.run_cli('publish',item['draft'],'--approve','--review','核对',ok=False)
  p.write_text(s+'\n[[Wiki/不存在]]\n');self.run_cli('publish',item['draft'],'--approve','--review','核对',ok=False)
 def test_missing_metadata_cannot_leave_partial_publication(self):
  item=self.ready();p=self.v/item['draft'];p.write_text(p.read_text().replace('tags: []\n',''))
  before={p.relative_to(self.v).as_posix():p.read_bytes() for p in self.v.rglob('*') if p.is_file()}
  self.run_cli('publish',item['draft'],'--approve','--review','核对',ok=False)
  self.assertEqual(before,{p.relative_to(self.v).as_posix():p.read_bytes() for p in self.v.rglob('*') if p.is_file()})
 def test_manual_index_and_wiki_content_survives(self):
  item=self.ready();p=self.v/'000-首页.md';p.write_text(p.read_text()+'\n我的手写段落\n')
  w=self.v/'Wiki/来源追溯.md';w.write_text('---\nschema_version: 1\ntype: concept\n---\n我的定义，不能改动。\n')
  self.run_cli('publish',item['draft'],'--approve','--review','核对','--wiki','来源追溯')
  self.assertIn('我的定义，不能改动。',w.read_text());self.assertIn('我的手写段落',p.read_text())
 def test_changed_same_source_does_not_overwrite(self):
  item=self.prepare();self.src.write_text('不同的新版原文');self.run_cli('import',str(self.src),'--title','来源核对','--source','https://example.org/article','--language','zh-Hans',ok=False)
  self.assertNotEqual((self.v/item['raw']).read_bytes(),self.src.read_bytes())
 def test_path_escape_rejected(self):
  self.run_cli('init');self.run_cli('publish','../原文.txt','--approve','--review','核对',ok=False)
 def test_log_tamper_detected(self):
  self.prepare();p=self.v/'docs/log.jsonl';p.write_text(p.read_text().replace('IMPORT','CHANGED'));self.run_cli('check',ok=False)
if __name__=='__main__':unittest.main()
