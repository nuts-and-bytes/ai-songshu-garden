import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const REPO = "nuts-and-bytes/ai-songshu-garden"

export default (() => {
  function GithubCTA({ displayClass }: QuartzComponentProps) {
    return (
      <div class={classNames(displayClass, "github-cta")}>
        <div class="github-cta-title">觉得这篇有用?</div>
        <div class="github-cta-actions">
          <a
            class="github-cta-star"
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="github-cta-star-label">⭐ 给本项目点个 Star</span>
            <img
              class="github-cta-badge"
              src={`https://img.shields.io/github/stars/${REPO}?style=social&label=`}
              alt="GitHub stars"
              loading="lazy"
            />
          </a>
          <a
            class="github-cta-link"
            href={`https://github.com/${REPO}/issues`}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 有想法或建议?来 Issues 公开聊聊 →
          </a>
          <a
            class="github-cta-link"
            href="https://github.com/nuts-and-bytes"
            target="_blank"
            rel="noopener noreferrer"
          >
            🔭 逛逛我的其他开源项目 →
          </a>
        </div>
      </div>
    )
  }

  return GithubCTA
}) satisfies QuartzComponentConstructor
