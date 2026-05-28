import Papa from "papaparse";
import { useState } from "react";

import axios from "axios";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";


function App() {

  const [portfolio, setPortfolio] = useState([
    { symbol: "", quantity: "" }
  ]);

  const [portfolioData, setPortfolioData] = useState(null);

  const [historyData, setHistoryData] = useState([]);

  const [insights, setInsights] = useState([]);

  const [question, setQuestion] = useState("");

  const [chatResponse, setChatResponse] = useState("");

  const [loading, setLoading] = useState(false);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6"
  ];


  const handleChange = (
    index,
    field,
    value
  ) => {

    const updatedPortfolio = [...portfolio];

    updatedPortfolio[index][field] = value;

    setPortfolio(updatedPortfolio);
  };


  const addStockField = () => {

    setPortfolio([
      ...portfolio,
      { symbol: "", quantity: "" }
    ]);
  };

  const handleCSVUpload = (event) => {

  const file = event.target.files[0];

  Papa.parse(file, {

    header: true,

    skipEmptyLines: true,

    complete: function(results) {

      const parsedPortfolio = results.data.map(item => ({

        symbol: item.symbol,

        quantity: item.quantity

      }));

      setPortfolio(parsedPortfolio);
    }
  });
};


  const analyzePortfolio = () => {

    setLoading(true);

    const formattedPortfolio = {};

    portfolio.forEach(stock => {

      if (
        stock.symbol &&
        stock.quantity
      ) {

        formattedPortfolio[
          stock.symbol.toUpperCase()
        ] = Number(stock.quantity);
      }
    });

    axios.post(
      "http://127.0.0.1:5000/portfolio",
      formattedPortfolio
    )

    .then(response => {

      setPortfolioData(response.data);

      axios.post(
        "http://127.0.0.1:5000/ai-insights",
        formattedPortfolio
      )

      .then(aiResponse => {

        setInsights(
          aiResponse.data.insights
        );
      });

      const firstStock =
        response.data.stocks[0]?.symbol;

      if (firstStock) {

        axios.get(
          `http://127.0.0.1:5000/history/${firstStock}`
        )

        .then(historyResponse => {

          setHistoryData(
            historyResponse.data
          );
        });
      }

      setLoading(false);
    })

    .catch(error => {

      console.log(error);

      setLoading(false);
    });
  };

  const askChatbot = () => {

  const formattedPortfolio = {};

  portfolio.forEach(stock => {

    if (
      stock.symbol &&
      stock.quantity
    ) {

      formattedPortfolio[
        stock.symbol.toUpperCase()
      ] = Number(stock.quantity);
    }
  });

  axios.post(
    "http://127.0.0.1:5000/chatbot",
    {
      question,
      portfolio: formattedPortfolio
    }
  )

  .then(response => {

    setChatResponse(
      response.data.response
    );
  })

  .catch(error => {

    console.log(error);
  });
};
  return (

    <div className="min-h-screen bg-gray-950 text-white p-8">

      {/* Header */}

      <div className="mb-10">

        <h1 className="text-5xl font-bold text-blue-400">

          Portfolio Risk Analyzer

        </h1>

        <p className="text-gray-400 mt-3 text-lg">

          AI-powered fintech dashboard for portfolio analytics

        </p>

      </div>


      {/* Input Section */}

      <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mb-8 max-w-3xl">

        <h2 className="text-2xl font-semibold mb-6">

          Enter Portfolio

        </h2>

      <div className="mb-6">

  <input
    type="file"
    accept=".csv"
    onChange={handleCSVUpload}
    className="block w-full text-sm text-gray-400"
  />

</div>

        {

          portfolio.map((stock, index) => (

            <div
              key={index}
              className="flex gap-4 mb-4"
            >

              <input

                type="text"

                placeholder="Stock Symbol"

                value={stock.symbol}

                onChange={(e) =>
                  handleChange(
                    index,
                    "symbol",
                    e.target.value
                  )
                }

                className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700"
              />

              <input

                type="number"

                placeholder="Quantity"

                value={stock.quantity}

                onChange={(e) =>
                  handleChange(
                    index,
                    "quantity",
                    e.target.value
                  )
                }

                className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700"
              />

            </div>
          ))
        }

        <div className="flex gap-4 mt-6">

          <button

            onClick={addStockField}

            className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-lg"
          >

            Add Stock

          </button>

          <button

            onClick={analyzePortfolio}

            className="bg-blue-500 hover:bg-blue-600 px-5 py-3 rounded-lg font-semibold"
          >

            Analyze Portfolio

          </button>

        </div>

      </div>


      {/* Loading */}

      {
        loading && (

          <div className="text-xl text-yellow-400 mb-8">

            Loading Portfolio Analysis...

          </div>
        )
      }


      {/* Dashboard */}

      {
        portfolioData && (

          <div>

            {/* Summary Cards */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

              <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">

                <h3 className="text-gray-400 mb-2">

                  Total Portfolio Value

                </h3>

                <p className="text-3xl font-bold text-green-400">

                  ₹
                  {portfolioData.total_portfolio_value}

                </p>

              </div>

              <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">

                <h3 className="text-gray-400 mb-2">

                  Risk Score

                </h3>

                <p className="text-3xl font-bold text-red-400">

                  {portfolioData.risk_score}

                </p>

              </div>

              <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">

                <h3 className="text-gray-400 mb-2">

                  Diversification

                </h3>

                <p className="text-3xl font-bold text-blue-400">

                  {portfolioData.diversification}

                </p>

              </div>

            </div>


            {/* Charts */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

              {/* Pie Chart */}

              <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">

                <h2 className="text-2xl font-semibold mb-6">

                  Portfolio Allocation

                </h2>

                <PieChart width={400} height={300}>

                  <Pie

                    data={portfolioData.stocks}

                    dataKey="allocation_percentage"

                    nameKey="symbol"

                    outerRadius={100}

                    label
                  >

                    {
                      portfolioData.stocks.map(
                        (entry, index) => (

                          <Cell
                            key={index}
                            fill={
                              COLORS[
                                index % COLORS.length
                              ]
                            }
                          />
                        )
                      )
                    }

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </div>


              {/* Line Chart */}

              <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">

                <h2 className="text-2xl font-semibold mb-6">

                  Stock Trend

                </h2>

                <LineChart
                  width={500}
                  height={300}
                  data={historyData}
                >

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />

                </LineChart>

              </div>

            </div>


            {/* Portfolio Table */}

            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">

              <h2 className="text-2xl font-semibold mb-6">

                Portfolio Breakdown

              </h2>

              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead>

                    <tr className="border-b border-gray-700">

                      <th className="p-3">Symbol</th>

                      <th className="p-3">Quantity</th>

                      <th className="p-3">Price</th>

                      <th className="p-3">Volatility</th>

                      <th className="p-3">Allocation %</th>

                    </tr>

                  </thead>

                  <tbody>

                    {
                      portfolioData.stocks.map(
                        (stock, index) => (

                          <tr
                            key={index}
                            className="border-b border-gray-800 hover:bg-gray-800"
                          >

                            <td className="p-3 font-semibold">

                              {stock.symbol}

                            </td>

                            <td className="p-3">

                              {stock.quantity}

                            </td>

                            <td className="p-3">

                              ₹{stock.latest_price}

                            </td>

                            <td className="p-3 text-red-400">

                              {stock.volatility}%

                            </td>

                            <td className="p-3">

                              {stock.allocation_percentage}%

                            </td>

                          </tr>
                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            </div>


            {/* AI Insights */}

            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mt-10">

              <h2 className="text-2xl font-semibold mb-6 text-blue-400">

                AI Financial Insights

              </h2>

              <div className="space-y-4">

                {
                  insights.map(
                    (insight, index) => (

                      <div
                        key={index}
                        className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                      >

                        {insight}

                      </div>
                    )
                  )
                }

              </div>

            </div>

            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mt-10">

  <h2 className="text-2xl font-semibold mb-6 text-green-400">

    AI Financial Assistant

  </h2>

  <textarea

    placeholder="Ask about your portfolio..."

    value={question}

    onChange={(e) =>
      setQuestion(e.target.value)
    }

    className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 mb-4"
  />

  <button

    onClick={askChatbot}

    className="bg-green-500 hover:bg-green-600 px-5 py-3 rounded-lg font-semibold"
  >

    Ask AI

  </button>

  {

    chatResponse && (

      <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700 whitespace-pre-line">

        {chatResponse}

      </div>
    )
  }

</div>

          </div>
        )
      }

    </div>
  );
}

export default App;