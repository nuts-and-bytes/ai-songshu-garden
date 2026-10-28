"""Replay a documented, pre-reviewed teaching example, not an automatic LLM eval."""
import argparse,json,subprocess,sys,hashlib
from pathlib import Path
import yaml
here=Path(__file__).resolve()
kit=here.parents[1] if (here.parents[1]/'brain.py').exists() else here.parents[2]/'public/downloads/stone-second-brain'
p=argparse.ArgumentParser();p.add_argument('--output',required=True);args=p.parse_args();v=Path(args.output).resolve()
def run(*args):
 r=subprocess.run([sys.executable,str(kit/'brain.py'),'--vault',str(v),*args],text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout
print(run('init'))
cmd=('import',str(kit/'examples/python/floatingpoint.rst'),'--title','Python-浮点数与显示误差','--source','https://docs.python.org/3.13/tutorial/floatingpoint.html','--language','en','--type','article','--retention','insight')
e=json.loads(run(*cmd));raw=(v/e['raw']).read_text();draft=v/e['draft']
meta=yaml.safe_load(draft.read_text().split('---\n')[1])
meta['evidence']=[
 {'claim':'显示舍入并未改变底层机器值','quote':'simply rounding the *display* of the true machine value.'},
 {'claim':'近似浮点数比较可使用 math.isclose','quote':'the :func:`math.isclose` function can be useful for comparing inexact values:'},
 {'claim':'精确十进制需求应考虑 decimal','quote':'For use cases which require exact decimal representation, try using the\n:mod:`decimal` module'}]
body=f'''\n# Python-浮点数与显示误差

来源：[[{e['raw'][:-3]}]]。Python 3.13.0 官方教程；这是一份经过本次验收核对的教学样例，不是用户的私人笔记。

## 摘要
浮点数近似来自二进制表示的限制。显示为 0.1，不代表机器保存的值等于精确的十进制十分之一。解决问题时，应先区分显示需求、近似比较和精确十进制计算。

## 核心要点
- 十进制 0.1 无法用有限二进制小数精确表示；在文中讨论的 binary64 条件下，机器使用邻近的可表示值。证据：开篇及 Representation Error。
- 格式化只改变显示。原文的 `0.1 + 0.1 + 0.1 == 0.3` 返回 False；预先 round 并不能修复这个比较。证据：相关 doctest。
- `math.isclose` 可用于近似值比较；确切十进制需求考虑 decimal，有理数需求考虑 fractions。不能据此声称所有场景都应弃用 float。证据：比较与精确算术段落。

## 值得深挖
AI 推断：做数据工具时先明确对“相等”的业务定义，再选择数值表示和比较方法。这个建议是对材料的应用，并非作者原句。
局限：这是 Python 3.13 文档快照，不能替代对具体系统、精度要求和输入数据的验证。
建议关联：浮点数、数值比较。它们描述同一份材料中的不同问题，不是在断言二者是因果同义词。
'''
draft.write_text('---\n'+yaml.safe_dump(meta,allow_unicode=True,sort_keys=False)+'---\n'+body)
print(run('publish',e['draft'],'--approve','--review','教学验收记录：已核对引用、显示与存储的区别，以及不能一概弃用 float 的限制；不代表真实读者已审阅。','--wiki','浮点数','--wiki','数值比较'))
print(run('check'));print(run('query','浮点数'));print(run('compile',e['source_id']));print(run('health','--write'))
before={p.relative_to(v).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in v.rglob('*') if p.is_file()}
run(*cmd)
after={p.relative_to(v).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in v.rglob('*') if p.is_file()}
assert before==after,'Repeated import changed the vault'
assert (v/e['raw']).read_bytes()==(kit/'examples/python/floatingpoint.rst').read_bytes()
print('PASS real source end-to-end: raw bytes preserved; reviewed note; two linked Wiki indexes; navigation and queue; query; compile; health; duplicate import unchanged')
print('source_id='+e['source_id'])
