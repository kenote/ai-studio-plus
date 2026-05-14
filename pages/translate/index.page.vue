<script lang="ts">
import { defineComponent, h } from 'vue'
import TranslateView from '@/views/TranslateView.vue'
import LayoutPanel from '@/layouts/LayoutPanel.vue'

export const documentProps = {
  title: 'AI Studio Plus - 翻译',
  description: 'AI Studio Plus - AI 翻译页面'
}

export default defineComponent({
  name: 'TranslatePage',
  components: {
    LayoutPanel,
    TranslateView
  },
  render() {
    return h(LayoutPanel, {}, {
      default: () => h(TranslateView)
    })
  }
})
</script>