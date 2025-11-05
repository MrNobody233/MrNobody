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

const renderedHtml = computed(() => {
  let html = md.render(content.value)
  html = processSpoiler(html)
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

    .editor-input,
    .editor-preview {
      flex: 1;
      overflow-y: auto;
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
      }
    }
  }
}
</style>

