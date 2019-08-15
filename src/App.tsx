import React from 'react';
import './App.css';
import {EcoreApp} from "./EcoreApp";

const App: React.FC = (props) => {
  return (
    <div className="App">
        <EcoreApp {...props} appName="ReportsApp" />
    </div>
  );
}

export default App;
