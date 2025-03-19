import React from 'react';
import { Route, Routes } from 'react-router-dom-v5-compat';

import { ChecksterPro } from './ChecksterPro';
import { Wizard } from './Wizard';

export function ChecksterRoutes() {
  return (
    <Routes>
      <Route index element={<ChecksterPro />} />
      <Route path="wizard" element={<Wizard />} />
      <Route path="*" element={<div>Checkster: Not found</div>} />
    </Routes>
  );
}
