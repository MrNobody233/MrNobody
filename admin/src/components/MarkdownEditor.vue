<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <el-button-group>
        <el-button size="small" @click="insertBold">
          <el-icon><bold /></el-icon> 加粗
        </el-button>
        <el-button size="small" @click="insertItalic">
          <el-icon><italic /></el-icon> 斜体
        </el-button>
        <el-button size="small" @click="insertStrikethrough">
          <el-icon><remove /></el-icon> 删除线
        </el-button>
        <el-button size="small" @click="insertSpoiler">
          <el-icon><hide /></el-icon> 隐藏文字
        </el-button>
        <el-button size="small" @click="insertTooltip">
          <el-icon><QuestionFilled /></el-icon> 提示
        </el-button>
      </el-button-group>
      <el-button-group style="margin-left: 10px">
        <el-button size="small" @click="insertHeading">
          <el-icon><edit /></el-icon> 标题
        </el-button>
        <el-button size="small" @click="insertLink">
          <el-icon><link /></el-icon> 链接
        </el-button>
        <el-button size="small" @click="insertImage">
          <el-icon><picture /></el-icon> 图片
        </el-button>
        <el-button size="small" @click="insertCode">
          <el-icon><document /></el-icon> 代码块
        </el-button>
      </el-button-group>
    </div>

    <div class="editor-content">
      <div class="editor-input">
        <el-input
          ref="textareaRef"
          v-model="content"
          type="textarea"
          placeholder="请输入Markdown内容..."
          @input="handleInput"
        />
      </div>
      <div class="editor-preview">
        <div class="preview-title">预览</div>
        <div class="preview-content" v-html="renderedHtml"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import markdownItMark from 'markdown-it-mark'
import markdownItContainer from 'markdown-it-container'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref()
const content = ref(props.modelValue)

// 初始化 Markdown 解析器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

// 添加 mark 支持（==高亮==）
md.use(markdownItMark)

// 自定义隐藏文字插件（!!隐藏文字!!）
md.use(markdownItContainer, 'spoiler', {
  validate: function(params: string) {
    return params.trim() === 'spoiler'
  },
  render: function(tokens: any, idx: number) {
    if (tokens[idx].nesting === 1) {
      return '<span class="spoiler">'
    } else {
      return '</span>'
    }
  }
})

// 简单实现：使用正则替换 !!text!! 为 spoiler
const processSpoiler = (text: string) => {
  return text.replace(/!!(.+?)!!/g, '<span class="spoiler">$1</span>')
}

// 处理提示文字：??文字|提示内容??
const processTooltip = (text: string) => {
  // QuestionFilled 图标的 SVG
  const questionIcon = '<svg class="tooltip-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="14" height="14"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496 0 9.216 1.024 18.432 2.048 27.648l2.048 12.288h94.72l-2.048-12.288c-1.024-6.144-1.024-12.288-1.024-18.432 0-25.6 5.12-45.568 15.36-60.416 10.24-14.848 25.6-22.272 46.08-22.272 20.48 0 35.84 7.424 46.08 22.272 10.24 14.848 15.36 34.816 15.36 60.416 0 20.48-3.072 38.912-9.216 55.296-6.144 16.384-15.36 30.72-27.648 42.24-12.288 12.288-27.648 23.04-46.08 32.256-18.432 9.216-40.96 18.432-67.584 27.648l-15.36 4.608c-5.12 1.024-9.216 3.072-12.288 6.144-3.072 3.072-5.12 6.144-6.144 10.24-1.024 4.096-1.024 8.192-1.024 12.288v40.96h94.72v-20.48c0-6.144 1.024-11.264 3.072-15.36 2.048-4.096 5.12-7.168 9.216-9.216l15.36-4.608c26.624-9.216 49.152-18.432 67.584-27.648 18.432-9.216 33.792-20.48 46.08-32.256 12.288-12.288 21.504-26.624 27.648-42.24 6.144-16.384 9.216-34.816 9.216-55.296 0-52.096-14.784-92.928-44.352-123.2-29.568-30.976-70.4-45.76-122.496-45.76zm-12.288 510.976a38.4 38.4 0 1 0 0 76.8 38.4 38.4 0 0 0 0-76.8z"/></svg>'
  return text.replace(/\?\?(.+?)\|(.+?)\?\?/g, `<span class="tooltip-text" data-tooltip="$2">$1${questionIcon}</span>`)
}

const renderedHtml = computed(() => {
  let html = md.render(content.value)
  html = processSpoiler(html)
  html = processTooltip(html)
  return html
})

watch(() => props.modelValue, (newVal) => {
  content.value = newVal
})

const handleInput = () => {
  emit('update:modelValue', content.value)
}

// 工具栏插入方法
const insertBold = () => {
  insertText('**', '**', '粗体文字')
}

const insertItalic = () => {
  insertText('*', '*', '斜体文字')
}

const insertStrikethrough = () => {
  insertText('~~', '~~', '删除线文字')
}

const insertSpoiler = () => {
  insertText('!!', '!!' , '鼠标悬停查看')
}

const insertTooltip = () => {
  insertText('??', '|提示内容??', '文字')
}

const insertHeading = () => {
  insertText('## ', '', '标题文字')
}

const insertLink = () => {
  insertText('[', '](https://example.com)', '链接文字')
}

const insertImage = () => {
  insertText('![', '](https://example.com/image.jpg)', '图片描述')
}

const insertCode = () => {
  insertText('\n```javascript\n', '\n```\n', '代码内容')
}

const insertText = (prefix: string, suffix: string, placeholder: string) => {
  const textarea = textareaRef.value?.textarea as HTMLTextAreaElement
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end) || placeholder

  const before = content.value.substring(0, start)
  const after = content.value.substring(end)

  content.value = before + prefix + selectedText + suffix + after
  emit('update:modelValue', content.value)

  // 设置光标位置
  setTimeout(() => {
    textarea.focus()
    const newPos = start + prefix.length + selectedText.length
    textarea.setSelectionRange(newPos, newPos)
  }, 0)
}
</script>

<style scoped lang="scss">
.markdown-editor {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;

  .editor-toolbar {
    padding: 10px;
    background-color: var(--el-fill-color-lighter);
    border-bottom: 1px solid var(--el-border-color);
  }

  .editor-content {
    display: flex;
    height: 600px;

    .editor-input {
      flex: 1;
      overflow-y: auto;
    }
    
    .editor-preview {
      flex: 1;
      overflow-y: auto;
      overflow-x: visible;
    }

    .editor-input {
      border-right: 1px solid var(--el-border-color);

      :deep(.el-textarea) {
        height: 100%;

        .el-textarea__inner {
          height: 100%;
          border: none;
          border-radius: 0;
          box-shadow: none;
          resize: none;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.6;
        }
      }
    }

    .editor-preview {
      padding: 20px;
      background-color: var(--el-bg-color);
      overflow: visible;

      .preview-title {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--el-border-color);
      }

      .preview-content {
        font-size: 15px;
        line-height: 1.8;
        color: var(--el-text-color-primary);
        overflow: visible;

        :deep(h1),
        :deep(h2),
        :deep(h3),
        :deep(h4),
        :deep(h5),
        :deep(h6) {
          margin: 20px 0 10px;
          font-weight: 600;
          line-height: 1.4;
        }

        :deep(h1) { font-size: 32px; }
        :deep(h2) { font-size: 28px; }
        :deep(h3) { font-size: 24px; }
        :deep(h4) { font-size: 20px; }

        :deep(p) {
          margin: 10px 0;
        }

        :deep(a) {
          color: var(--el-color-primary);
          text-decoration: none;
          &:hover {
            text-decoration: underline;
          }
        }

        :deep(code) {
          background-color: var(--el-fill-color-light);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
        }

        :deep(pre) {
          background-color: var(--el-fill-color-light);
          padding: 15px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 15px 0;

          code {
            background: none;
            padding: 0;
          }
        }

        :deep(blockquote) {
          border-left: 4px solid var(--el-color-primary);
          padding-left: 15px;
          margin: 15px 0;
          color: var(--el-text-color-secondary);
        }

        :deep(ul),
        :deep(ol) {
          padding-left: 30px;
          margin: 10px 0;
        }

        :deep(li) {
          margin: 5px 0;
        }

        :deep(img) {
          max-width: 100%;
          border-radius: 8px;
          margin: 15px 0;
        }

        :deep(table) {
          border-collapse: collapse;
          width: 100%;
          margin: 15px 0;

          th,
          td {
            border: 1px solid var(--el-border-color);
            padding: 8px 12px;
            text-align: left;
          }

          th {
            background-color: var(--el-fill-color-light);
            font-weight: 600;
          }
        }

        :deep(mark) {
          background-color: #fff566;
          padding: 2px 4px;
          border-radius: 2px;
        }

        :deep(.spoiler) {
          background-color: var(--el-text-color-primary);
          color: transparent;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 2px;
          transition: all 0.3s;
          user-select: none;

          &:hover {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-primary);
          }
        }

        :deep(.tooltip-text) {
          position: relative;
          display: inline-block;
          color: var(--el-color-primary);
          cursor: help;
          border-bottom: 1px dashed var(--el-color-primary);

          .tooltip-icon {
            display: inline-block;
            margin-left: 4px;
            vertical-align: middle;
            color: var(--el-color-primary);
            flex-shrink: 0;
          }

          &::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 14px;
            background-color: rgba(0, 0, 0, 0.95);
            color: white;
            font-size: 13px;
            line-height: 1.5;
            border-radius: 6px;
            white-space: pre-wrap;
            max-width: 320px;
            min-width: 100px;
            width: max-content;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity 0.3s, visibility 0.3s;
            z-index: 999999;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
            word-wrap: break-word;
          }

          &::before {
            content: '';
            position: absolute;
            bottom: calc(100% + 2px);
            left: 50%;
            transform: translateX(-50%);
            border: 7px solid transparent;
            border-top-color: rgba(0, 0, 0, 0.95);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity 0.3s, visibility 0.3s;
            z-index: 999999;
          }

          &:hover::after,
          &:hover::before {
            opacity: 1;
            visibility: visible;
          }
        }
      }
    }
  }
}
</style>

