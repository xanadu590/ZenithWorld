// wiki/.vuepress/types/vuepress-client.d.ts
declare module '@vuepress/client' {
  import type { ComputedRef } from 'vue'

  // 返回 ComputedRef<T>，这样组件里才能用 fm.value
  export function usePageFrontmatter<T = any>(): ComputedRef<T>
  export function usePageData<T = any>(): ComputedRef<T>
  export function usePagesData(): Record<string, () => Promise<any>>

  export function useRouteLocale(): string
  export function useSiteData<T = any>(): ComputedRef<T>
  export function useSiteLocaleData<T = any>(): ComputedRef<T>
}