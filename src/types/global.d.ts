// interface Window {
//   publicPath?: string;
// }
declare namespace Global {
  interface Pagination {
    total: number;
    pageSize: number;
    current: number;
  }

  interface IGetList {
    pageNo: number;
    pageSize: number;
    category?: string;
    kw?: string;
    spaceId?: number;
    dataType?: string;
    justReturnSpaceData?: boolean;
  }
}

// 扩展全局作用域
declare global {
  interface Window {
    Global: typeof Global;
    __NUWAX_RUNTIME_CONFIG__?: import('@/utils/runtimeConfig').NuwaxRuntimeConfig;
    NuwaClawBridge?: {
      perf?: {
        enabled?: () => boolean;
        mark?: (stage: string, payload?: Record<string, unknown>) => void;
        markOnce?: (
          key: string,
          stage: string,
          payload?: Record<string, unknown>,
        ) => void;
      };
    };
  }
}
