<script lang="ts">
import { defineComponent, h } from 'vue'
import HomeView from '@/views/HomeView.vue'
import LayoutPanel from '@/layouts/LayoutPanel.vue'

export const documentProps = {
  title: 'AI Studio Plus - 首页',
  description: 'AI Studio Plus - 基于 Vue 3 + TypeScript 的 AI 对话应用'
}

export default defineComponent({
  name: 'IndexPage',
  components: {
    LayoutPanel,
    HomeView
  },
  render() {
    return h(LayoutPanel, {}, {
      default: () => h(HomeView)
    })
  }
})
</script>