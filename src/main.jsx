import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import CorpusNew from './pages/CorpusNew';
import Explorer from './pages/Explorer';
import Comparator from './pages/Comparator';
import Generator from './pages/Generator';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/corpus/new" element={<CorpusNew />} />
          <Route path="/corpus/:id/explore" element={<Explorer />} />
          <Route path="/corpus/:id/compare" element={<Comparator />} />
          <Route path="/corpus/:id/generate" element={<Generator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
