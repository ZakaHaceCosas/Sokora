import type { ChartConfiguration } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { compile } from "mathjs";
import type { FeatureOutput } from "types";

export async function graph(options: {
  function: string;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}): Promise<FeatureOutput<Buffer>> {
  const { xmin, xmax, ymin, ymax } = options;

  try {
    const compiled = compile(options.function);
    compiled.evaluate({ x: 0 });

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 800,
      height: 600,
      backgroundColour: "#151515",
    });

    const points = 1000;
    const data = [];

    for (let index = 0; index <= points; index++) {
      const x = xmin + (index * (xmax - xmin)) / points;
      try {
        const y: unknown = compiled.evaluate({ x });
        if (typeof y == "number" && Number.isFinite(y)) data.push({ x, y });
      } catch {
        continue;
      }
    }

    const config: ChartConfiguration = {
      type: "line",
      data: {
        datasets: [
          {
            label: `f(x) = ${options.function}`,
            data: data,
            borderColor: "#ff0000",
            borderWidth: 4,
            pointRadius: 0,
            fill: false,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: "linear" as const,
            position: "center" as const,
            min: xmin,
            max: xmax,
            grid: {
              color: "#ffffff",
              lineWidth: 2,
            },
            ticks: {
              color: "#ffffff",
              align: "start",
              labelOffset: 1,
            },
          },
          y: {
            type: "linear" as const,
            position: "center" as const,
            min: ymin,
            max: ymax,
            grid: {
              color: "#ffffff",
              lineWidth: 2,
            },
            ticks: {
              color: "#ffffff",
              align: "start",
              labelOffset: 1,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    };

    return {
      success: true,
      feature: "math/graph",
      out: await chartJSNodeCanvas.renderToBuffer(config),
    };
  } catch {
    return {
      success: false,
      feature: "math/graph",
      out: {
        title: "Invalid function.",
        reason:
          'Please provide a valid mathematical function. Examples: "x^2", "sin(x)", "2*x + 1".',
      },
    };
  }
}
