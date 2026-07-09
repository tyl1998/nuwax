import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiGetMyModels, MyModelPermissionsTab } from '@/services/modelConfig';
import { ModelConfigDto } from '@/types/interfaces/systemManage';
import { Select } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface OptimizeModelSelectorProps {
  /** 当前选中的模型ID，undefined 表示使用租户默认模型 */
  value?: number;
  /** 模型变更回调，undefined 表示使用租户默认模型 */
  onChange?: (modelId?: number) => void;
  className?: string;
}

/**
 * 优化类弹窗（prompt/code 优化）使用的轻量模型选择器
 * 仅负责选择，不涉及模型的增删改
 * 数据源为当前用户有权限的模型（系统模型 + 个人空间模型）
 */
const OptimizeModelSelector: React.FC<OptimizeModelSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const [loading, setLoading] = useState(false);
  const [modelList, setModelList] = useState<ModelConfigDto[]>([]);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const tabs: MyModelPermissionsTab[] = ['System', 'Space'];
      const results = await Promise.all(tabs.map((tab) => apiGetMyModels(tab)));
      const merged = results
        .filter((res) => res.code === SUCCESS_CODE && res.data)
        .flatMap((res) => res.data as ModelConfigDto[]);
      // 按模型ID去重
      const uniqueMap = new Map<number, ModelConfigDto>();
      merged.forEach((m) => uniqueMap.set(m.id, m));
      setModelList(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error('Failed to get model list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const DEFAULT_VALUE = '__default__';

  const options = useMemo(
    () => [
      {
        label: dict('PC.Components.OptimizeModelSelector.defaultModel'),
        value: DEFAULT_VALUE,
      },
      ...modelList.map((m) => ({
        label: m.name,
        value: m.id,
      })),
    ],
    [modelList],
  );

  return (
    <Select
      className={className}
      loading={loading}
      value={value ?? DEFAULT_VALUE}
      placeholder={dict('PC.Components.OptimizeModelSelector.selectModel')}
      options={options}
      onChange={(val: number | string) =>
        onChange?.(val === DEFAULT_VALUE ? undefined : (val as number))
      }
      style={{ minWidth: 160 }}
      allowClear={false}
    />
  );
};

export default OptimizeModelSelector;
