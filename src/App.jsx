import { useState, useEffect, useRef } from "react";
import "./App.css";
import ethereumLogo from "./assets/ethereum-logo.png";

const COINGECKO_API =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

// 1 gwei = 1e9 wei, 1 eth = 1e18 wei. Wei is integer-valued and must be
// handled with BigInt to stay exact above 2^53 (~0.009 ETH), where a JS
// number would lose precision.
const GWEI_SCALE = 9;
const ETH_SCALE = 18;

function App() {
  const [loading, setLoading] = useState(true);
  const [priceError, setPriceError] = useState(false);
  const [price, setPrice] = useState(null);

  const [weiStr, setWeiStr] = useState("");
  const [gweiStr, setGweiStr] = useState("");
  const [ethStr, setEthStr] = useState("");
  const [usd, setUsd] = useState("0");

  // The canonical integer wei value behind the form, kept as a BigInt so it
  // survives past 2^53.
  const [weiValue, setWeiValue] = useState(null);

  const reset = () => {
    setWeiStr("");
    setGweiStr("");
    setEthStr("");
    setUsd("0");
    setWeiValue(null);
  };

  // Format a BigInt wei value as a fractional string with `scale` decimals,
  // trimming trailing zeros.
  const formatWei = (wei, scale) => {
    const s = wei.toString().padStart(scale + 1, "0");
    const intPart = s.slice(0, -scale) || "0";
    let fracPart = s.slice(-scale).replace(/0+$/, "");
    return fracPart ? `${intPart}.${fracPart}` : intPart;
  };

  // Convert a fractional user input (gwei/eth) to an integer wei BigInt by
  // string-shifting the decimal point.
  // Returns null for empty / negative input.
  const weiFromFractional = (raw, scale) => {
    if (raw === "" || raw == null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    const cleaned = raw.replace(/[^0-9.]/g, "");
    if (cleaned === "" || cleaned === ".") return null;
    const [intPart = "0", fracPart = ""] = cleaned.split(".");
    if (fracPart.includes(".")) return null; // multiple dots
    const digits = `${intPart}${fracPart.padEnd(scale, "0").slice(0, scale)}`;
    try {
      return BigInt(digits || "0");
    } catch {
      return null;
    }
  };

  // USD value for a given wei BigInt, guarded so a missing price (fetch
  // failed or still in flight) renders "0" rather than NaN / "$null".
  const usdForWei = (wei, currentPrice) => {
    if (currentPrice == null) return "0";
    const eth = Number(wei) / 1e18;
    if (!Number.isFinite(eth)) return "0";
    return (eth * currentPrice).toFixed(2);
  };

  // Handle input changes and convert all values.
  const valueChangeHandler = (input, event) => {
    const value = event.target.value;

    // type="number" can emit "1e9", "-5", ".", etc. Empty or
    // invalid input resets the whole form to a clean state.
    if (value === "") {
      reset();
      return;
    }

    let weiBigInt;
    if (input === "wei") {
      // Wei is integer-only; strip anything non-numeric.
      const raw = value.replace(/[^0-9]/g, "");
      if (raw === "") {
        reset();
        return;
      }
      try {
        weiBigInt = BigInt(raw);
      } catch {
        reset();
        return;
      }
      setWeiStr(raw);
    } else if (input === "gwei") {
      weiBigInt = weiFromFractional(value, GWEI_SCALE);
      if (weiBigInt == null) {
        reset();
        return;
      }
      setGweiStr(value);
    } else {
      // input === "eth"
      weiBigInt = weiFromFractional(value, ETH_SCALE);
      if (weiBigInt == null) {
        reset();
        return;
      }
      setEthStr(value);
    }

    setWeiValue(weiBigInt);
    if (input !== "wei") setWeiStr(weiBigInt.toString());
    if (input !== "gwei") setGweiStr(formatWei(weiBigInt, GWEI_SCALE));
    if (input !== "eth") setEthStr(formatWei(weiBigInt, ETH_SCALE));
    setUsd(usdForWei(weiBigInt, price));
  };

  const fetchPrice = useRef(async () => {
    setLoading(true);
    setPriceError(false);
    try {
      const res = await fetch(COINGECKO_API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPrice(data?.ethereum?.usd ?? null);
    } catch (error) {
      console.error("Error fetching ETH price:", error);
      setPriceError(true);
    } finally {
      setLoading(false);
    }
  });
  useEffect(() => {
    fetchPrice.current();
  }, []);

  // When the price resolves after the user already typed a value, recompute
  // the USD display so it doesn't stay stuck on "0".
  useEffect(() => {
    if (weiValue != null) setUsd(usdForWei(weiValue, price));
  }, [price, weiValue]);

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
        <h2>ETH: ${loading ? "…" : price != null ? price : "unavailable"}</h2>
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
              inputMode="decimal"
              min="0"
              value={weiStr}
              onChange={(e) => valueChangeHandler("wei", e)}
              style={{ height: "1.5rem" }}
            />
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={gweiStr}
              onChange={(e) => valueChangeHandler("gwei", e)}
              style={{ height: "1.5rem" }}
            />
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={ethStr}
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
            <label>Eth</label>
          </div>
        </div>

        <p style={{ fontSize: "1.3em", fontWeight: 600 }}>${usd} USD</p>
        {priceError && (
          <p style={{ color: "#c33", fontSize: "0.85em" }}>
            Price unavailable — USD value will show as $0.
          </p>
        )}
      </div>
      <p className="read-the-docs">
        A simple ETH converter to convert common ETH denominations.
      </p>
    </>
  );
}

export default App;
