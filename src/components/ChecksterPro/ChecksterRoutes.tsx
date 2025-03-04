import React from 'react';
import { Route, Routes } from 'react-router-dom-v5-compat';

import { ZeroStateView } from './views/ZeroStateView';
import { ChecksterPro } from './ChecksterPro';

export function ChecksterRoutes() {
  return (
    <Routes>
      <Route index element={<ChecksterPro />} />
      <Route path="zero-state" element={<ZeroStateView />} />
      <Route path="*" element={<div>Checkster: Not found</div>} />
    </Routes>
  );
}
