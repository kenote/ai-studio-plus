<template>
  <div
    class="h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800"
  >
    <div class="text-center">
      <h2
        class="text-[120px] font-bold text-zinc-200 dark:text-zinc-700 leading-none select-none m-0"
      >
        404
      </h2>
      <p class="text-6xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2 mt-2">Not Found</p>
      <p class="text-zinc-500 dark:text-zinc-400 mb-8">抱歉，您访问的页面不存在</p>
      <router-link
        to="/"
        class="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
      >
        <i class="i-lucide-arrow-left" />
        返回首页
      </router-link>
    </div>
  </div>
</template>
