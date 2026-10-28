请用这个目录里的 stone 第二大脑 v2 起步包，帮我建立可使用的 Obsidian 知识库。不要重新发明脚本。

先读 README.md、CLAUDE.md 和 docs/开始使用.md，确认当前目录有 brain.py 与 requirements.txt。缺文件时停止，不能假装已经安装。如果你不能操作本地文件和终端，明确告诉我并给手动步骤。

先确认要创建的新空库路径；不得改动现有知识库，不复制其他目录的私人笔记、配置或密钥。检查 Python 版本；在本工具目录创建独立虚拟环境，通过 requirements.txt 安装依赖（这一步需网络），不使用 sudo、不改全局环境。运行 brain.py doctor，再用 --vault 指定新目录执行 init。之后脚本均可离线运行。

按开始使用指南，导入包内 Python 官方浮点数教程：保留原链接、语言 en、类型 article、retention insight。读取 import 返回的实际 source_id、raw 和 draft，不猜文件名。完整读 Raw，再按笔记模板在该草稿中写中文摘要、核心要点、值得深挖和 evidence；quote 必须逐字出自原文，区分原文与 AI 推断，不改来源字段。

把草稿、关键引用、限制及建议关联给我看，并停在正式入库前。等我核对并用自己的话复述理解后，才可以用 publish --approve --review；review 使用我本次真实表达，禁止代写授权。没有实际关联就不创建 Wiki，不为凑图谱数量虚构联系。

入库后运行 check、query 主题词、compile 本次 source_id、health。确认首页、索引、队列和双向链接已更新，再重复 import 同一文件，检查没有重复 Note。保持原文和草稿不动。

告诉我如何在 Obsidian 打开新库、从首页点到 Note、Wiki、Raw，打开关系图谱与反向链接。报告实际验证项和未验证项；脚本通过不代表语义自动正确，不声称已经配置模型账号、音视频转录或原库全部插件。
