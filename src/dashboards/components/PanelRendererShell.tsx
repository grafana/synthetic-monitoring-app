import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { FieldConfigSource, LoadingState, PanelData, PanelMenuItem } from '@grafana/data';
import { PanelRenderer } from '@grafana/runtime';
import { Menu, PanelChrome } from '@grafana/ui';

interface PanelRendererShellProps {
  title: string;
  description?: string;
  pluginId: string;
  fieldConfig: FieldConfigSource;
  options: Record<string, unknown>;
  data: PanelData;
  menuItems?: PanelMenuItem[];
  headerActions?: ReactNode;
  height?: number | string;
}

export function PanelRendererShell({
  title,
  description,
  pluginId,
  fieldConfig,
  options,
  data,
  menuItems,
  headerActions,
  height = 300,
}: PanelRendererShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setDimensions({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const panelMenu =
    menuItems?.length &&
    (() => (
      <Menu>
        {menuItems.map((item) => (
          <Menu.Item
            key={item.text}
            label={item.text ?? ''}
            icon={item.iconClassName === 'compass' ? 'compass' : item.iconClassName === 'copy' ? 'copy' : undefined}
            url={'href' in item ? item.href : undefined}
            onClick={'onClick' in item ? item.onClick : undefined}
          />
        ))}
      </Menu>
    ));

  return (
    <div style={{ height: typeof height === 'number' ? height : height, width: '100%' }}>
      <PanelChrome
        title={title}
        description={description}
        menu={panelMenu || undefined}
        actions={headerActions}
        loadingState={data.state}
        onCancelQuery={data.state === LoadingState.Loading ? () => undefined : undefined}
      >
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: typeof height === 'number' ? Math.max(height - 32, 0) : height ?? 268,
            minHeight: typeof height === 'number' ? Math.max(height - 32, 0) : undefined,
          }}
        >
          {dimensions.width > 0 && dimensions.height > 0 ? (
            <PanelRenderer
              title={title}
              pluginId={pluginId}
              width={dimensions.width}
              height={dimensions.height}
              data={data}
              fieldConfig={fieldConfig}
              options={options}
            />
          ) : null}
        </div>
      </PanelChrome>
    </div>
  );
}
