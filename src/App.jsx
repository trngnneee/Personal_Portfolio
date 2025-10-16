import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './pages/home/Home';
import { AOSConfig } from './config/aos.config';
import Layout from './pages/layout';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster />
      <AOSConfig />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </Layout>
        </Router>
    </>
  )
}

export default App
