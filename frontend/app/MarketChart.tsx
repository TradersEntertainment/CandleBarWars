'use client';
import { createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export const MarketChart = ({ data, colors: { backgroundColor = 'transparent', lineColor = '#2962FF', textColor = 'white', areaTopColor = '#2962FF', areaBottomColor = 'rgba(41, 98, 255, 0.28)' } = {} }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
        };

        const chart = createChart(chartContainerRef.current!, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current?.clientWidth,
            height: 250,
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.1)' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: 'rgba(197, 203, 206, 0.2)',
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.2)',
            },
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#22c55e', // green-500
            downColor: '#ef4444', // red-500
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // Data must be sorted by time.
        // Format: { time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 }
        candlestickSeries.setData(data);
        chart.timeScale().fitContent();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

    return (
        <div ref={chartContainerRef} className="w-full h-full" />
    );
};
