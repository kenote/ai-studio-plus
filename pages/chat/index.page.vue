<script lang="ts">
import { defineComponent, h } from 'vue'
import ChatView from '@/views/ChatView.vue'
import LayoutPanel from '@/layouts/LayoutPanel.vue'

export const documentProps = {
  title: 'AI Studio Plus - 对话',
  description: 'AI Studio Plus - AI 对话页面'
}

export default defineComponent({
  name: 'ChatPage',
  components: {
    LayoutPanel,
    ChatView
  },
  render() {
    return h(LayoutPanel, {}, {
      default: () => h(ChatView)
    })
  }
})
</script>