import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
// @ts-ignore
import script from "./scripts/readcount.inline"

export default (() => {
  function ReadCount({ displayClass }: QuartzComponentProps) {
    return <span class={classNames(displayClass, "read-count")} hidden></span>
  }

  ReadCount.afterDOMLoaded = script

  return ReadCount
}) satisfies QuartzComponentConstructor
