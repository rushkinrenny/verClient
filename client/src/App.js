import { useState } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  const handleButtonClick = (text) => {
    if (text !== "") {
      setQuery(text);
      setText("");
    }
  };
  const handleEnterPress = (e) => {
    if (e.which === 13) {
      e.preventDefault();

      let text = e.target.value;
      if (text !== "") {
        setQuery(text);
        setText("");
      }
    }
  };

  const setEncryption = (enc) => {
    const url = `/encryption?enc=${enc}`;
    axios
      .get(url)
      .then((response) => "")
      .catch((err) => console.log("Encryption Error:", err));
  };

  const handleSelection = (e) => {
    setEncryption(e.target.value);
  };

  const handleUrl = () => {
    return query ? `/query?q=${query}` : null;
  };

  return (
    <div className="App">
      <div>
        <div>
          <h1 id="heading">Virtual Encrypted Route</h1>
        </div>
        <select
          onChange={(e) => handleSelection(e)}
          name="encryption"
          id="encrpyt"
        >
          <option value="Default">Select</option>
          <option value="aes-128-cbc">AES-128</option>
          <option value="aes-192-cbc">AES-192</option>
          <option value="aes-256-cbc">AES-256</option>
          <option value="des-ecb">DES</option>
          <option value="des-ede3">Triple DES</option>
        </select>
        <input
          className="textInput"
          type="text"
          value={text}
          onKeyPress={(e) => handleEnterPress(e)}
          onChange={(e) => {
            setQuery("");
            setText(e.target.value);
          }}
        />
        <button className="searchBtn" onClick={() => handleButtonClick(text)}>
          Search
        </button>
      </div>
      <div style={{ height: 40 }}></div>
      <div>
        <iframe
          className="browsingFrame"
          src={handleUrl()}
          sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
          title="SearchEngine"
        ></iframe>
      </div>
    </div>
  );
}

export default App;
