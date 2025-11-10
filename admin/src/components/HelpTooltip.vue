<template>
  <span class="help-tooltip">
    <span class="help-text">{{ text }}</span>
    <el-tooltip
      :content="tooltip"
      placement="top"
      :effect="effect"
      :raw-content="rawContent"
    >
      <el-icon class="help-icon">
        <QuestionFilled />
      </el-icon>
    </el-tooltip>
  </span>
</template>

<script setup lang="ts">
import { QuestionFilled } from '@element-plus/icons-vue'

interface Props {
  text: string
  tooltip: string
  effect?: 'dark' | 'light'
  rawContent?: boolean
}

withDefaults(defineProps<Props>(), {
  effect: 'dark',
  rawContent: false
})
</script>

<style scoped lang="scss">
.help-tooltip {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .help-text {
    display: inline-block;
  }

  .help-icon {
    color: var(--el-text-color-secondary);
    cursor: help;
    font-size: 14px;
    transition: color 0.3s;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}
</style>

