import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Main from './pages/Main'
import Header from './components/Header';
function App() {
  return (
    <Router>
      <div className="App">
        <Header />
          <Routes>
            <Route path="/" element={<Main />}/>
          </Routes>
      </div>
    </Router>

  );
}

export default App;
