import { useState, useEffect } from "react";
import "./App.css";
import ethereumLogo from "./assets/ethereum-logo.png";

function App() {
  const coinGeckoApi =
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState(null);
  const [wei, setWei] = useState();
  const [gwei, setGwei] = useState();
  const [eth, setEth] = useState();
  const [usd, setUsd] = useState(0);

  const reset = () => {
    setWei("");
    setEth("");
    setGwei("");
    setUsd(0);
  };

  // Handle input changes and convert all values
  const valueChangeHandler = (input, event) => {
    const value = event.target.value;

    // if the input is cleared, reset everything
    if (value === "") {
      reset();
      return;
    }
    // Set value of wei and convert to gwei and eth
    if (input === "wei") {
      setWei(value);
      setGwei((value / 1e9).toFixed(9));
      setEth((value / 1e18).toFixed(18));
      setUsd(((value / 1e18) * price).toFixed(18));
    }
    // Set value of gwei and convert to wei and eth
    else if (input === "gwei") {
      setGwei(value);
      setWei(value * 1e9);
      setEth((value / 1e9).toFixed(9));
      setUsd(((value / 1e9) * price).toFixed(9));
    }
    // Set value of eth and convert to gwei and wei
    else if (input === "eth") {
      setEth(value);
      setWei(value * 1e18);
      setGwei(value * 1e9);
      setUsd((value * price).toFixed(2));
    }
  };

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      try {
        const res = await fetch(coinGeckoApi);
        const data = await res.json();
        setPrice(data.ethereum.usd);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, []);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          className="logo"
          src={ethereumLogo}
          alt="Ethereum logo"
          width="25"
          height="25"
        />
        <h2>ETH: ${price}</h2>
      </div>
      <div className="card">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.7rem" }}
          >
            <input
              type="number"
              value={wei}
              onChange={(e) => valueChangeHandler("wei", e)}
              style={{ height: "1.5rem" }}
            />
            <input
              type="number"
              value={gwei}
              onChange={(e) => valueChangeHandler("gwei", e)}
              style={{ height: "1.5rem" }}
            />
            <input
              type="number"
              value={eth}
              onChange={(e) => valueChangeHandler("eth", e)}
              style={{ height: "1.5rem" }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2.7rem",
              alignItems: "start",
            }}
          >
            <label>Wei</label>
            <label>Gwei</label>
            <label>Ether</label>
          </div>
        </div>

        <p style={{ fontSize: "1.3em", fontWeight: 600 }}>${usd} USD</p>
        {/* <p className="read-the-docs"></p> */}
      </div>
      <p className="read-the-docs">
        A simple ETH converter to convert common ETH denominations.
      </p>
    </>
  );
}

export default App;
