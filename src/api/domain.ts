// 这是一个临时的类型定义，为了让代码能顺利编译。
// 理想情况下，它应该从由 swagger 生成的 types/api.ts 文件中导入。
export interface Domain {
  ID: number;
  Domain: string;
  Status: 'verified' | 'pending' | 'expired';
  VerifyToken: string;
  BillingData: any;
  CreatedAt: string;
  UpdatedAt: string;
  expires_in_days?: number;
}

/**
 * 这是一个专门用于获取域名列表的函数，
 * TanStack Query 将会调用它。
 */
export const getDomains = async (): Promise<Domain[]> => {
  const response = await fetch('/api/v1/domains?scope=public');

  if (!response.ok) {
    throw new Error('网络响应错误');
  }

  // 后端返回的数据结构是 { success: true, data: [...] } 或类似结构
  const result = await response.json();

  // 根据 admin-frontend 的经验，数据可能在 result.data.data 中
  // 但在这里我们先假设数据直接在 result.data 中
  if (result && result.data) {
    return result.data;
  }
  
  // 如果直接返回的就是数组
  if (Array.isArray(result)) {
      return result;
  }

  throw new Error('返回的数据格式不正确');
};

