'use strict';
(function () {

    class Utility {
        constructor() {
            this.className = "SpectrumHelper";
        }

        calculateYPosition(value, canvasHeight) {
            const normalizedValue = (value - window.SpectrumProperties.minY) / (window.SpectrumProperties.maxY - window.SpectrumProperties.minY);
            return canvasHeight - (normalizedValue * canvasHeight);
        }


        convertPixelToXValue(pixel, xStart, xEnd, width, margins) {
            const normalizedX = (pixel - margins.left) / (width - margins.left - margins.right);
            return xStart + normalizedX * (xEnd - xStart);
        }

        calculateXPosition(frequency, xStart, xEnd, margins, width) {
            var normalized_frequency = (frequency - xStart) / (xEnd - xStart);
            return margins.left + normalized_frequency * (width - margins.left - margins.right)


        }

        calculateLabelStep(maxY, minY) {
            const range = maxY - minY;
            let step = Math.ceil(range / 5);
            if (step < 1) step = 1;
            return step;
        }

    }

    class GridHelper {
        constructor() {
            this.className = "GridHelper";
            this.globalProperties = window.SpectrumProperties;
            this.spectrumHelpers = window.SpectrumHelpers;
        }

        draw() {
            this.drawXGrid();
            this.drawYGrid();
        }

        drawXGrid() {
            const { canvas, ctx, initialXStart, initialXEnd, margins, xDelta } = this.globalProperties;
            const { width, height } = canvas;

            const numberOfOriginalLabels = Math.round((initialXEnd - initialXStart) / xDelta);
            // Dikey Çizgiler
            for (let i = 0; i <= numberOfOriginalLabels; i++) {
                ctx.beginPath();
                ctx.setLineDash([1, 3]);
                ctx.moveTo(margins.left + (width - margins.left - margins.right) / numberOfOriginalLabels * i, margins.top);
                ctx.lineTo(margins.left + (width - margins.left - margins.right) / numberOfOriginalLabels * i, height - margins.bottom);
                ctx.strokeStyle = '#E0E0E0';
                ctx.stroke();
            }
        }

        drawYGrid() {
            const { width, height } = this.globalProperties.canvas;
            const { maxY, minY, margins, ctx } = this.globalProperties;
            const { Utility } = this.spectrumHelpers;

            // Yatay Çizgiler
            const labelStep = Utility.calculateLabelStep(maxY, minY);
            const numberOfYLabels = (maxY - minY) / labelStep;
            for (let i = 0; i <= numberOfYLabels; i++) {
                const yValue = maxY - (labelStep * i);
                const yPosition = Utility.calculateYPosition(yValue, height - margins.bottom - margins.top) + margins.top;

                ctx.beginPath();
                ctx.setLineDash([1, 3]);
                ctx.moveTo(margins.left, yPosition);
                ctx.lineTo(width - margins.right, yPosition);
                ctx.strokeStyle = '#E0E0E0';
                ctx.stroke();
            }

            ctx.setLineDash([]);
        }

    }

    class ZoomHelper {
        constructor() {
            this.className = "ZoomHelper";
            this.globalProperties = window.SpectrumProperties;
            this.isZooming = false;
            this.zoomEnd = this.zoomStart = { x: null, y: null };
        }

        handleMouseDown(event) {
            if (event.shiftKey && event.button === 0) {
                if (event.offsetX > this.globalProperties.margins.left && event.offsetX < this.globalProperties.canvas.width - this.globalProperties.margins.right) {
                    this.isZooming = true;
                    this.zoomStart = { x: event.offsetX, y: event.offsetY };
                    this.zoomEnd = { ...this.zoomStart };
                }
            }
        }

        handleMouseMove(event) {
            if (this.isZooming) {
                // Mouse'un canvas sınırları içinde olduğundan emin ol
                if (event.offsetX > this.globalProperties.margins.left && event.offsetX < this.globalProperties.canvas.width - this.globalProperties.margins.right) {
                    this.zoomEnd = { x: event.offsetX, y: event.offsetY };
                    this.draw();
                }
            }
        }

        handleMouseUp(event) {
            if (this.isZooming) {
                this.isZooming = false;
                this.applyZoom();
            }
        }

        draw() {
            if (this.isZooming) {
                const { canvas, ctx, margins } = this.globalProperties;
                ctx.fillStyle = 'rgba(100, 100, 255, 0.3)'; // Yarı saydam mavi
                ctx.strokeStyle = 'rgba(100, 100, 255, 0.8)'; // Daha belirgin mavi çerçeve
                ctx.lineWidth = 1;
                ctx.beginPath();
                const rectWidth = this.zoomEnd.x - this.zoomStart.x;
                ctx.fillRect(this.zoomStart.x, margins.top, rectWidth, canvas.height - margins.top - margins.bottom);
                ctx.strokeRect(this.zoomStart.x, margins.top, rectWidth, canvas.height - margins.top - margins.bottom);
                ctx.closePath();
            }
        }

        applyZoom() {
            const { Utility } = window.SpectrumHelpers;
            const { xStart, xEnd, canvas, margins } = this.globalProperties;
            const zoomXStart = Math.min(this.zoomStart.x, this.zoomEnd.x);
            const zoomXEnd = Math.max(this.zoomStart.x, this.zoomEnd.x);

            const newStart = Utility.convertPixelToXValue(zoomXStart, xStart, xEnd, canvas.width, margins);
            const newEnd = Utility.convertPixelToXValue(zoomXEnd, xStart, xEnd, canvas.width, margins);

            if (newStart < newEnd) {
                this.globalProperties.xStart = newStart;
                this.globalProperties.xEnd = newEnd;

            }
        }

        resetZoom() {
            this.globalProperties.xStart = this.globalProperties.initialXStart;
            this.globalProperties.xEnd = this.globalProperties.initialXEnd;
        }

        isZoomed(initialXStart, initialXEnd, xStart, xEnd) {
            return xStart !== initialXStart || xEnd !== initialXEnd;
        }
    }

    class AxesHelper {
        constructor() {
            this.className = "AxesHelper";
            this.globalProperties = window.SpectrumProperties;
            this.spectrumHelpers = window.SpectrumHelpers;

        }

        draw() {
            const { ctx, canvas, margins } = this.globalProperties;
            const { width, height } = canvas;
            ctx.beginPath();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = "1";

            // X Axes
            ctx.moveTo(margins.left, height - margins.bottom);
            ctx.lineTo(width - margins.right, height - margins.bottom);

            // Y Axes
            ctx.moveTo(margins.left, margins.top);
            ctx.lineTo(margins.left, height - margins.bottom);
            ctx.stroke();

            this.drawLabels();
        }

        drawLabels() {
            this.drawXLabels();
            this.drawYLabels();
        }

        drawXLabels() {
            const { ctx, canvas, margins, initialXStart, initialXEnd, xStart, xEnd, xDelta } = this.globalProperties;
            const { width } = canvas;

            const numberOfOriginalLabels = Math.round((initialXEnd - initialXStart) / xDelta);
            const numberOfLabels = ((xEnd - xStart) / numberOfOriginalLabels).toFixed(3);

            for (let i = 0; i <= numberOfOriginalLabels; i++) {
                const xValue = xStart + (numberOfLabels * i);
                const xPosition = margins.left + (width - margins.left - margins.right) / numberOfOriginalLabels * i;
                ctx.font = "13px Arimo";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.fillText(xValue.toFixed(3), xPosition, canvas.height - margins.bottom + 15);
            }
        }

        drawYLabels() {
            const { ctx, canvas, margins, minY, maxY } = this.globalProperties;
            const { width, height } = canvas;

            const labelStep = this.spectrumHelpers.Utility.calculateLabelStep(maxY, minY);
            const numberOfLabels = (maxY - minY) / labelStep;

            for (let i = 0; i <= numberOfLabels; i++) {
                const yValue = maxY - (labelStep * i);
                const yPosition = this.spectrumHelpers.Utility.calculateYPosition(yValue, height - margins.bottom - margins.top) + margins.top;
                ctx.font = "13px Arimo";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "right";
                ctx.fillText(yValue.toFixed(0), margins.left - 10, yPosition);
            }
        }


    }

    class Spectrum {
        constructor(container, xStart, xEnd, xDelta, margins) {
            window.SpectrumProperties = {
                container: container,
                initialXStart: xStart,
                initialXEnd: xEnd,
                xStart: xStart,
                xEnd: xEnd,
                xDelta: xDelta,
                margins: margins,
                layers: new Map(),
            };

            this.init();
            this.registerHelpers();

            // SNR için eklenen yeni özellikler
            this.enableSnrLine = false;
            this.draggingSnrLine = false;
            this.snrLinePosition = 100; // Başlangıç pozisyonu, gerektiği gibi ayarlayın

            // Mouse eventlerini tanımla
            this.attachMouseEvents();

        }

        init() {
            const canvas = document.createElement('canvas');
            canvas.style = "position:absolute; display:none;";
            canvas.id = "source-canvas";
            const canvas2 = document.createElement('canvas');
            canvas2.style = "position:absolute; z-index=1;";
            canvas2.id = "temp-canvas";
            canvas.width = window.SpectrumProperties.container.offsetWidth;
            canvas.height = window.SpectrumProperties.container.offsetHeight;
            //tempCanvas
            canvas2.width = window.SpectrumProperties.container.offsetWidth;
            canvas2.height = window.SpectrumProperties.container.offsetHeight;

            window.SpectrumProperties.container.appendChild(canvas2);
            window.SpectrumProperties.ctx2 = canvas2.getContext('2d');
            window.SpectrumProperties.canvas2 = canvas2;

            //mainCanvas
            window.SpectrumProperties.container.appendChild(canvas);
            window.SpectrumProperties.canvas = canvas;
            window.SpectrumProperties.ctx = canvas.getContext('2d');
            window.SpectrumProperties.ctx.fillStyle = "black";
            window.SpectrumProperties.ctx.fillRect(0, 0, canvas.width, canvas.height);

        }

        registerHelpers() {
            window.SpectrumHelpers = {
                Utility: new Utility()
            };
            window.SpectrumHelpers.GridHelper = new GridHelper();
            window.SpectrumHelpers.ZoomHelper = new ZoomHelper();
            window.SpectrumHelpers.AxesHelper = new AxesHelper();
            window.SpectrumHelpers.SignalLinesHelper = new SignalLinesHelper();

        }

        attachMouseEvents() {
            window.SpectrumProperties.canvas2.addEventListener('mousedown', this.handleMouseDown.bind(this));
            window.SpectrumProperties.canvas2.addEventListener('mousemove', this.handleMouseMove.bind(this));
            window.SpectrumProperties.canvas2.addEventListener('mouseup', this.handleMouseUp.bind(this));
            window.SpectrumProperties.canvas2.addEventListener('contextmenu', this.handleRightClick.bind(this));
        }

        handleMouseDown(event) {
            if (this.enableSnrLine && event.offsetY >= this.snrLinePosition - 5 && event.offsetY <= this.snrLinePosition + 5) {
                this.draggingSnrLine = true;
                return; // Zoom işlemi başlatmamak için
            }
            window.SpectrumHelpers.ZoomHelper.handleMouseDown(event);
        }

        handleMouseMove(event) {
            if (this.draggingSnrLine) {
                this.snrLinePosition = event.offsetY;
                this.draw();
            }
            window.SpectrumHelpers.ZoomHelper.handleMouseMove(event);
        }

        handleMouseUp(event) {
            if (this.draggingSnrLine) {
                console.log("SNR dB Değeri:", this.convertPixelToYValue(this.snrLinePosition));
                this.draggingSnrLine = false;
            }
            window.SpectrumHelpers.ZoomHelper.handleMouseUp(event);


        }

        handleRightClick(event) {
            event.preventDefault(); // Varsayılan sağ tıklama menüsünü engelle
            window.SpectrumHelpers.ZoomHelper.resetZoom();
        }

        addLayer(layer) {
            var map = window.SpectrumProperties.layers;

            //Validations 
            if (map.has(layer.id)) {
                console.error("Aynı id ye sahip olan layer eklenemez.");
            }
            layer.setOnDataChange(this.draw.bind(this));
            map.set(layer.id, layer);
        }

        removeLayer(layer) {
            var map = window.SpectrumProperties;
            if (map.has(layer.id) === false) {
                console.error("Layer bulunamadı.");
            }
            map.delete(layer.id);
        }

        
        draw2(){
            window.SpectrumProperties.ctx2.clearRect(0, 0, window.SpectrumProperties.ctx.canvas.width, window.SpectrumProperties.ctx.canvas.height);
            window.SpectrumProperties.ctx2.drawImage(window.SpectrumProperties.canvas, 0, 0, window.SpectrumProperties.canvas.width, window.SpectrumProperties.canvas.height);
        }

        draw() {
            
            window.SpectrumProperties.ctx.clearRect(0, 0, window.SpectrumProperties.ctx.canvas.width, window.SpectrumProperties.ctx.canvas.height);
            if (this.isZooming) {
                this.drawZoomRect();
            };
            Array.from(window.SpectrumProperties.layers.values()).forEach((layer) => {
                layer.draw();
            });

            window.SpectrumHelpers.AxesHelper.draw();
            window.SpectrumHelpers.GridHelper.draw();
            window.SpectrumHelpers.ZoomHelper.draw();
            window.SpectrumHelpers.SignalLinesHelper.draw();
            this.draw2();
            // this.drawSnrLine(); // SNR çizgisini çizmek için eklenen çağrı
        }

        convertPixelToYValue(pixel) {
            if (this.enableSnrLine) {
                const normalizedY = (pixel - this.margins.top) / (this.ctx.canvas.height - this.margins.top - this.margins.bottom);
                return this.fixedMaxY - normalizedY * (this.fixedMaxY - this.fixedMinY);
            }
            const { height } = this.ctx.canvas;
            const normalizedY = (pixel - this.margins.top) / (height - this.margins.top - this.margins.bottom);
            return this.maxY - normalizedY * (this.maxY - this.minY);
        }

        drawSpectrum() {
            if (this.xStart != this.initialXStart) {
                this.updateZoomedData();
            }

            const { width, height } = this.ctx.canvas;
            const marginLeft = this.margins.left;
            const marginBottom = this.margins.bottom;
            const marginTop = this.margins.top;
            const marginRight = this.margins.right;
            const numberOfPoints = this.data.length;

            this.ctx.beginPath();
            this.ctx.strokeStyle = "#028000";
            this.ctx.lineWidth = "0.75";

            this.data.forEach((value, index) => {
                const xPosition = marginLeft + (width - marginLeft - marginRight) / numberOfPoints * index;
                const yPosition = this.calculateYPosition(value, this.maxY, this.minY, height - marginBottom - marginTop) + marginTop;

                if (index === 0) {
                    this.ctx.moveTo(xPosition, yPosition);
                } else {
                    this.ctx.lineTo(xPosition, yPosition);
                }
            });

            this.ctx.stroke();
        }

        updateData(layerId, newData, frequencyBands) {
            var map = new Map();
            map.get(layerId).setData(newData);

            // Yeni veriyi işle

            // this.originalData = newData;
            // this.originalDataLength = newData.length;
            // // Orijinal veriyi güncelle
            // this.originalData = newData;


            this.maxY = Math.max(...newData);
            this.minY = Math.min(...newData);
            // this.frequencyBands = frequencyBands;

            // // Zoom uygulanmışsa, veriyi bu zoom seviyesine göre kırp
            // if (this.isZoomed()) {
            //     this.updateZoomedData();
            // } else {
            //     // Zoom uygulanmamışsa, tüm veriyi kullan
            //     this.data = newData;
            // }

            // // Görüntüyü yeniden çiz
            this.draw();
            // this.drawFrequencyBands();
        }

        updateSignalLines(data) {
            window.SpectrumHelpers.SignalLinesHelper.updateData(data);
        }

        // drawFrequencyBands() {
        //     if (!this.frequencyBands || !this.frequencyBands.length) return;

        //     this.frequencyBands.forEach(band => {
        //         const cfInKHz = band.cf * 1000; // MHz'den kHz'e dönüşüm
        //         const xStart = this.calculateXPosition(cfInKHz - band.bw / 2);
        //         const xEnd = this.calculateXPosition(cfInKHz + band.bw / 2);
        //         const width = xEnd - xStart;
        //         const height = this.ctx.canvas.height - this.margins.top - this.margins.bottom;
        //         this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Kırmızı, yarı saydam
        //         this.ctx.lineWidth = 2;
        //         this.ctx.strokeRect(xStart, this.margins.top, width, height);
        //         this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; // Kırmızı, yarı saydam
        //         this.ctx.fillRect(xStart, this.margins.top, width, height);

        //     });
        // }

        setEnableSnrLine(enable) {
            this.enableSnrLine = enable;
            if (enable) {
                this.fixedMaxY = this.maxY;
                this.fixedMinY = this.minY;
            } else {
                this.fixedMaxY = null;
                this.fixedMinY = null;
            }
        }
        // SNR çizgisini çizme
        drawSnrLine() {
            if (!this.enableSnrLine) return;

            const { width } = this.ctx.canvas;
            this.ctx.beginPath();
            this.ctx.strokeStyle = "blue";
            this.ctx.lineWidth = 2;
            this.ctx.moveTo(this.margins.left, this.snrLinePosition);
            this.ctx.lineTo(width - this.margins.right, this.snrLinePosition);
            this.ctx.stroke();
        }

    }

    class Layer1d {
        constructor(id, size, color, lineWidth) {
            this.id = id;
            this.size = size;
            if (color === undefined) {
                color = "#028000"
            }
            this.color = color;;
            this.lineWidth = lineWidth = "0.75";
        }

        setData(newData) {
            var convertedData = this.convertData(newData, 1e-20, 10);
            this.data = convertedData;
            this.onDataChange();
        }

        setOnDataChange(fncOnDataChange) {
            this.onDataChange = fncOnDataChange;
        }


        draw() {
            if (this.data === undefined || this.data === null || this.data.length == 0) return;
            var data = [...this.data];
            const { xStart, xEnd, initialXStart, initialXEnd, canvas, ctx, margins } = window.SpectrumProperties;
            const { ZoomHelper, Utility } = window.SpectrumHelpers;
            const { width, height } = canvas;

            if (ZoomHelper.isZoomed(initialXStart, initialXEnd, xStart, xEnd)) {
                data = this.updateZoomedData(initialXStart, initialXEnd, xStart, xEnd, data);
            }

            window.SpectrumProperties.maxY = Math.max(...data);
            window.SpectrumProperties.minY = Math.min(...data);



            const numberOfPoints = data.length;

            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;

            data.forEach((value, index) => {
                const xPosition = margins.left + (width - margins.left - margins.right) / numberOfPoints * index;
                const yPosition = Utility.calculateYPosition(value, height - margins.bottom - margins.bottom) + margins.top;
                if (index === 0) {
                    ctx.moveTo(xPosition, yPosition);
                } else {
                    ctx.lineTo(xPosition, yPosition);
                }
            });
            ctx.stroke();
        }

        updateZoomedData(initialXStart, initialXEnd, xStart, xEnd, data) {
            const dataPointsPerPixel = data.length / (initialXEnd - initialXStart);
            const startIndex = Math.floor((xStart - initialXStart) * dataPointsPerPixel);
            const endIndex = Math.ceil((xEnd - initialXStart) * dataPointsPerPixel);
            data = data.slice(startIndex, endIndex);
            return data;
        }

        convertData(src, lo_thresh, mul) {
            var dst = [];
            if (lo_thresh === undefined) {
                lo_thresh = 1.0e-20;
            }
            for (var i = 0; i < src.length; i++) {
                src[i] = (Math.log(Math.max(src[i], lo_thresh)) / Math.log(10));
                dst[i] = src[i] * mul;
            }
            return dst;
        }
    }

    class Layer2d {
        constructor(id, size, color, lineWidth) {
            this.id = id;
            this.size = size;
            if (color === undefined) {
                color = "#028000"
            }
            this.color = color;;
            this.lineWidth = lineWidth = "0.75";
            this.datas = new Map();

        }

        setData(id, newData) {
            var convertedData = this.convertData(newData, 1e-20, 10);
            this.datas.set(id, convertedData);
            this.debouncedDraw();
        }

        setOnDataChange(fncOnDataChange) {
            this.onDataChange = fncOnDataChange;
            this.debouncedDraw = this.debounce(this.onDataChange.bind(this), 35);

        }

        debounce(func, wait) {
            let timeout;
            return function(...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    requestAnimationFrame(() => {
                        func.apply(context, args);
                    });
                }, wait);
            };
        }

        draw() {
            if (this.datas === undefined || this.datas === null || this.datas.length == 0) return;

            Array.from(this.datas.values()).forEach((data, index2) => {

                const { xStart, xEnd, initialXStart, initialXEnd, canvas, ctx, margins } = window.SpectrumProperties;
                const { ZoomHelper, Utility } = window.SpectrumHelpers;
                const { width, height } = canvas;

                if (ZoomHelper.isZoomed(initialXStart, initialXEnd, xStart, xEnd)) {
                    data = this.updateZoomedData(initialXStart, initialXEnd, xStart, xEnd, data);
                }

                window.SpectrumProperties.maxY = Math.max(...data);
                window.SpectrumProperties.minY = Math.min(...data);



                const numberOfPoints = data.length;

                ctx.beginPath();
                ctx.lineWidth = this.lineWidth;
                ctx.beginPath();
                data.forEach((value, index) => {
                    if (index2 == 0) {
                        this.color = "red"
                    } else {
                        this.color = "green";
                    }
                    ctx.strokeStyle = this.color;

                    const xPosition = margins.left + (width - margins.left - margins.right) / numberOfPoints * index;
                    const yPosition = Utility.calculateYPosition(value, height - margins.bottom - margins.bottom) + margins.top;
                    if (index === 0) {
                        ctx.moveTo(xPosition, yPosition);
                    } else {
                        ctx.lineTo(xPosition, yPosition);
                    }
                });
                ctx.stroke();
                ctx.closePath();

            })
        }

        updateZoomedData(initialXStart, initialXEnd, xStart, xEnd, data) {
            const dataPointsPerPixel = data.length / (initialXEnd - initialXStart);
            const startIndex = Math.floor((xStart - initialXStart) * dataPointsPerPixel);
            const endIndex = Math.ceil((xEnd - initialXStart) * dataPointsPerPixel);
            data = data.slice(startIndex, endIndex);
            return data;
        }

        convertData(src, lo_thresh, mul) {
            var dst = [];
            if (lo_thresh === undefined) {
                lo_thresh = 1.0e-20;
            }
            for (var i = 0; i < src.length; i++) {
                src[i] = (Math.log(Math.max(src[i], lo_thresh)) / Math.log(10));
                dst[i] = src[i] * mul;
            }
            return dst;
        }
    }

    class SignalLinesHelper {
        constructor() {
            this.className = "SignalLinesHelper";
            this.globalProperties = window.SpectrumProperties;
            this.spectrumHelpers = window.SpectrumHelpers;
            this.isActive = false;
            this.data = [];
            this.color = "blue";
            this.lineWidth = "2"; 3
        }

        updateData(data) {
            this.data = data;
        }

        draw() {
            if (this.data.length == 0) return;
            var data = [...this.data];

            if (data === undefined || data === null || data.length == 0) return;

            const { xStart, xEnd, initialXStart, initialXEnd, canvas, ctx, margins } = window.SpectrumProperties;
            const { ZoomHelper, Utility } = window.SpectrumHelpers;
            const { width, height } = canvas;

            if (ZoomHelper.isZoomed(initialXStart, initialXEnd, xStart, xEnd)) {
                data = this.findNumbersInRange(data, xStart, xEnd);
            }

            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;
            data.forEach((value) => {
                const xPosition = Utility.calculateXPosition(value, xStart, xEnd, margins, canvas.width);
                ctx.moveTo(xPosition, height - margins.bottom);
                ctx.lineTo(xPosition, margins.top);

            });
            ctx.stroke();
            ctx.closePath();
        }

        findNumbersInRange(array, start, end) {
            return array.filter(number => number >= start && number <= end);
        }
    }

    function SignalPlotJS() {

    }

    SignalPlotJS.Spectrum = Spectrum;
    SignalPlotJS.Layer1d = Layer1d;
    SignalPlotJS.Layer2d = Layer2d;

    module.exports = SignalPlotJS;
}());


