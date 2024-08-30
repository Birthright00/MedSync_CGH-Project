import "./App.css";
import ScrollToTop from "./components/ScrollToTop";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages_login/LoginPage";
function App() {
  return (
    <Router>
      <div className="App">
        <ScrollToTop/>
        <Routes>
          <Route exact path="/" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
