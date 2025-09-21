import { nanoid } from 'nanoid';
import { convertBase64ToBlob } from '../../utils';
import Camera from '../../utils/camera';
import * as tf from '@tensorflow/tfjs';
import * as ort from 'onnxruntime-web';
import { saveData, loadData } from '../../data/localstorage.js';

export default class Scanner {
  #form;
  #isCameraOpen = false;
  #takenDocumentations = [];
  #camera;
  #model = null;
  #yoloSession = null;
  #isModelLoading = false;
  #isModelLoaded = false;
  #trashClasses = ['Anorganik', 'Organik'];

  #classColors = {
    'Anorganik': 'red',
    'Organik': 'green',
    'Unknown': 'gray',
    'Error': 'black'
  };

  constructor() {
    this.#loadFromLocalStorage();
    this.#loadModel();
    this.#loadYOLOModel();
  }

  #loadFromLocalStorage() {
    const savedData = loadData();
    this.#takenDocumentations = savedData.map((item) => {
      const blob = this.#base64ToBlob(item.base64, 'image/png');
      return {
        id: item.id,
        blob: blob,
        base64: item.base64,
        classification: item.classification,
      };
    });
  }

  async #loadModel() {
    try {
      this.#isModelLoading = true;
      this.#model = await tf.loadGraphModel('/models/tfjs_model/model.json');
      this.#isModelLoaded = true;
      this.#isModelLoading = false;
      const dummyInput = tf.zeros([1, 224, 224, 3]);
      await this.#model.execute({ inputs: dummyInput });
      dummyInput.dispose();
    } catch (error) {
      console.error('Error loading classification model:', error);
      this.#isModelLoading = false;
    }
  }

  async #loadYOLOModel() {
    try {
      this.#yoloSession = await ort.InferenceSession.create('/models/YOLO/best.onnx');
      console.log('YOLO model loaded!');
    } catch (error) {
      console.error('Error loading YOLO model:', error);
    }
  }

  async #classifyImage(imageElement) {
    if (!this.#isModelLoaded) {
      return { className: 'Unknown', confidence: 0, description: 'Model belum dimuat' };
    }

    try {
      const tensor = tf.tidy(() => tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims(0));
      const predictions = await this.#model.predict(tensor).data();
      tensor.dispose();

      const maxIndex = predictions.indexOf(Math.max(...predictions));
      const confidence = predictions[maxIndex];
      const className = this.#trashClasses[maxIndex] || 'Unknown';
      const description = this.#generateDescription(className, confidence);

      return {
        className,
        confidence: Math.round(confidence * 100),
        description,
      };
    } catch (error) {
      console.error('Error during classification:', error);
      return { className: 'Error', confidence: 0, description: 'Terjadi kesalahan saat klasifikasi' };
    }
  }

  #generateDescription(className, confidence) {
    const descriptions = {
      Anorganik: 'Sampah yang tidak dapat terurai. Perlu penanganan khusus.',
      Organik: 'Sampah yang dapat terurai secara alami. Cocok untuk kompos.',
      Error: 'Terjadi kesalahan dalam proses klasifikasi.',
    };

    const baseDescription = descriptions[className] || descriptions['Unknown'];
    if (confidence > 0.8) return `${baseDescription} (Tingkat kepercayaan: Tinggi)`;
    if (confidence > 0.6) return `${baseDescription} (Tingkat kepercayaan: Sedang)`;
    return `${baseDescription} (Tingkat kepercayaan: Rendah)`;
  }

  async render() {
    return `
      <section id="scanner" class="scanner background-section">
        <form id="new-form" class="new-form">
          <div class="scanner-container">
            <h1 class="section-title">Pemindai Sampah</h1>
            ${this.#isModelLoading ? '<div class="loading-indicator">Memuat model AI...</div>' : ''}
            <div class="new-form__documentations__container">
              <div class="camera-section-wrapper">
                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video" class="new-form__camera__video"></video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
                </div>
                <div id="camera-tools" class="new-form__camera__tools">
                  <select id="camera-select"></select>
                </div>
                <div class="new-form__documentations__buttons">
                  <div class="camera-btn-container">
                    <div class="documentations-buttons-container">
                      <button id="documentations-input-button" class="button white-button" type="button">Upload Gambar</button>
                      <input id="documentations-input" class="new-form__documentations__input" name="documentations" type="file" accept="image/*" multiple />
                      <button id="open-documentations-camera-button" class="button white-button" type="button">Buka Kamera</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="camera-line"></div>
              <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
            </div>
          </div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.#setupForm();
    await this.#populateTakenPictures();
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const insertingPicturesPromises = Object.values(event.target.files).map(async (file) => {
        const base64 = await this.#fileToBase64(file);
        return await this.#addTakenPicture(file, base64);
      });
      await Promise.all(insertingPicturesPromises);
      await this.#populateTakenPictures();
      saveData(this.#takenDocumentations);
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations-input').click();
    });

    const cameraTools = document.getElementById('camera-tools');
    document.getElementById('open-documentations-camera-button').addEventListener('click', async (event) => {
      cameraTools.classList.toggle('open');
      this.#isCameraOpen = cameraTools.classList.contains('open');

      if (this.#isCameraOpen) {
        event.currentTarget.textContent = 'Tutup Kamera';
        this.#setupCamera();
        this.#camera.launch();
        this.#startDetectionLoop();
        return;
      }

      event.currentTarget.textContent = 'Buka Kamera';
      this.#camera.stop();
    });
  }

  #setupCamera() {
    if (this.#camera) return;

    this.#camera = new Camera({
      video: document.getElementById('camera-video'),
      cameraSelect: document.getElementById('camera-select'),
      canvas: document.getElementById('camera-canvas'),
    });
  }

  #startDetectionLoop() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const ctx = canvas.getContext('2d');

    const loop = async () => {
      if (!this.#isCameraOpen || !this.#yoloSession) {
        requestAnimationFrame(loop);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      canvas.width = vw;
      canvas.height = vh;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, vw, vh);

      const offscreen = document.createElement('canvas');
      offscreen.width = 640;
      offscreen.height = 640;
      const offCtx = offscreen.getContext('2d');
      offCtx.drawImage(video, 0, 0, 640, 640);

      const imageData = offCtx.getImageData(0, 0, 640, 640);
      const float32Data = new Float32Array(640 * 640 * 3);
      for (let i = 0, j = 0; i < imageData.data.length; i += 4) {
        float32Data[j++] = imageData.data[i] / 255;
        float32Data[j++] = imageData.data[i + 1] / 255;
        float32Data[j++] = imageData.data[i + 2] / 255;
      }

      try {
        const tensor = new ort.Tensor('float32', float32Data, [1, 3, 640, 640]);
        const feeds = { images: tensor };
        const results = await this.#yoloSession.run(feeds);

        const outputName = Object.keys(results)[0];
        const output = results[outputName];
        
        const detections = this.#parseMethod3(output, vw, vh);

        this.#drawDetections(ctx, detections);

      } catch (error) {
        console.error('Detection error:', error);
      }

      requestAnimationFrame(loop);
    };

    loop();
  }

  #tryDifferentParsing(output, vw, vh) {
    const ctx = document.getElementById('camera-canvas').getContext('2d');

    console.log('\n=== TRYING DIFFERENT PARSING METHODS ===');

    console.log('\n--- Method 1: Original (x1,y1,x2,y2,conf,class) ---');
    const method1Results = this.#parseMethod1(output, vw, vh);
    console.log('Method 1 detections:', method1Results.length);
    if (method1Results.length > 0) {
      console.log('Sample detection:', method1Results[0]);
      this.#drawDetections(ctx, method1Results);
    }

    console.log('\n--- Method 2: Center format (cx,cy,w,h,conf,class) ---');
    const method2Results = this.#parseMethod2(output, vw, vh);
    console.log('Method 2 detections:', method2Results.length);
    if (method2Results.length > 0) {
      console.log('Sample detection:', method2Results[0]);
      this.#drawDetections(ctx, method2Results);
    }

    console.log('\n--- Method 3: YOLOv8 format ---');
    const method3Results = this.#parseMethod3(output, vw, vh);
    console.log('Method 3 detections:', method3Results.length);
    if (method3Results.length > 0) {
      console.log('Sample detection:', method3Results[0]);
      this.#drawDetections(ctx, method3Results);
    }

    console.log('\n--- Method 4: Low threshold inspection ---');
    this.#inspectRawData(output);
  }

  #parseMethod1(output, vw, vh) {
    const detections = [];
    const threshold = 0.25;

    const elementsPerDetection = 6;
    for (let i = 0; i < output.data.length; i += elementsPerDetection) {
      if (i + (elementsPerDetection - 1) >= output.data.length) break;

      const x1_norm = output.data[i];
      const y1_norm = output.data[i + 1];
      const x2_norm = output.data[i + 2];
      const y2_norm = output.data[i + 3];
      const confidence = output.data[i + 4];
      const classId = Math.round(output.data[i + 5]);

      if (confidence > threshold && classId >= 0 && classId < this.#trashClasses.length) {
        detections.push({
          x1: x1_norm * vw,
          y1: y1_norm * vh,
          x2: x2_norm * vw,
          y2: y2_norm * vh,
          confidence,
          classId,
          method: 'Method1'
        });
      }
    }

    return detections;
  }

  #parseMethod2(output, vw, vh) {
    const detections = [];
    const threshold = 0.25;

    const elementsPerDetection = 6;
    for (let i = 0; i < output.data.length; i += elementsPerDetection) {
      if (i + (elementsPerDetection - 1) >= output.data.length) break;

      const cx_norm = output.data[i];
      const cy_norm = output.data[i + 1];
      const w_norm = output.data[i + 2];
      const h_norm = output.data[i + 3];
      const confidence = output.data[i + 4];
      const classId = Math.round(output.data[i + 5]);

      if (confidence > threshold && classId >= 0 && classId < this.#trashClasses.length) {
        const x1 = (cx_norm - w_norm / 2) * vw;
        const y1 = (cy_norm - h_norm / 2) * vh;
        const x2 = (cx_norm + w_norm / 2) * vw;
        const y2 = (cy_norm + h_norm / 2) * vh;

        detections.push({
          x1, y1, x2, y2,
          confidence,
          classId,
          method: 'Method2'
        });
      }
    }

    return detections;
  }

  #parseMethod3(output, vw, vh) {
    const detections = [];
    const threshold = 0.25;
    const iouThreshold = 0.45;

    if (output.dims.length === 3) {
      const [batch, features, numBoxes] = output.dims;
      console.log(`YOLOv8 3D format detected: batch=${batch}, features=${features}, boxes=${numBoxes}`);
      
      const candidates = [];

      for (let i = 0; i < numBoxes; i++) {
        if ((3 * numBoxes + i) >= output.data.length) {
            console.warn(`Index out of bounds for box coordinates at box ${i}. Skipping this box.`);
            continue;
        }

        const cx_norm = output.data[i];
        const cy_norm = output.data[numBoxes + i];
        const w_norm = output.data[2 * numBoxes + i];
        const h_norm = output.data[3 * numBoxes + i];

        let maxConf = 0;
        let bestClass = -1;

        for (let c = 0; c < this.#trashClasses.length; c++) {
          const classConfIndex = (4 + c) * numBoxes + i;
          if (classConfIndex >= output.data.length) {
            console.warn(`Index out of bounds for class confidence: ${classConfIndex}. Stopping class parsing for box ${i}.`);
            break;
          }
          const conf = output.data[classConfIndex];
          if (conf > maxConf) {
            maxConf = conf;
            bestClass = c;
          }
        }

        if (maxConf > threshold && bestClass !== -1) {
          console.log(`Box ${i}: cx=${cx_norm.toFixed(4)}, cy=${cy_norm.toFixed(4)}, w=${w_norm.toFixed(4)}, h=${h_norm.toFixed(4)}, conf=${maxConf.toFixed(4)}, class=${bestClass}`);

          const x1 = (cx_norm - w_norm / 2) * vw;
          const y1 = (cy_norm - h_norm / 2) * vh;
          const x2 = (cx_norm + w_norm / 2) * vw;
          const y2 = (cy_norm + h_norm / 2) * vh;
          
          console.log(`Scaled box ${i}: x1=${x1.toFixed(2)}, y1=${y1.toFixed(2)}, x2=${x2.toFixed(2)}, y2=${y2.toFixed(2)}, width=${(x2-x1).toFixed(2)}, height=${(y2-y1).toFixed(2)}`);

          candidates.push({
            x1, y1, x2, y2,
            confidence: maxConf,
            classId: bestClass,
            method: 'YOLOv8'
          });
        }
      }
      return this.#nonMaxSuppression(candidates, iouThreshold);

    } else if (output.dims.length === 2) {
      const [numDetections, numFeatures] = output.dims;
      console.log(`YOLO 2D format detected: detections=${numDetections}, features=${numFeatures}`);
      
      const candidates = [];

      for (let i = 0; i < numDetections; i++) {
          const offset = i * numFeatures;
          if ((offset + numFeatures - 1) >= output.data.length) {
              console.warn(`Index out of bounds for box ${i} (2D format). Skipping.`);
              continue;
          }

          const cx_norm = output.data[offset + 0];
          const cy_norm = output.data[offset + 1];
          const w_norm = output.data[offset + 2];
          const h_norm = output.data[offset + 3];

          let maxConf = 0;
          let bestClass = -1;

          for (let c = 0; c < this.#trashClasses.length; c++) {
              const confIndex = offset + 4 + c;
              if (confIndex >= output.data.length) {
                  console.warn(`Class confidence index out of bounds for box ${i}, class ${c}.`);
                  break;
              }
              const conf = output.data[confIndex];
              if (conf > maxConf) {
                  maxConf = conf;
                  bestClass = c;
              }
          }

          if (maxConf > threshold && bestClass !== -1) {
              console.log(`Box ${i}: cx=${cx_norm.toFixed(4)}, cy=${cy_norm.toFixed(4)}, w=${w_norm.toFixed(4)}, h=${h_norm.toFixed(4)}, conf=${maxConf.toFixed(4)}, class=${bestClass}`);

              const x1 = (cx_norm - w_norm / 2) * vw;
              const y1 = (cy_norm - h_norm / 2) * vh;
              const x2 = (cx_norm + w_norm / 2) * vw;
              const y2 = (cy_norm + h_norm / 2) * vh;

              console.log(`Scaled box ${i}: x1=${x1.toFixed(2)}, y1=${y1.toFixed(2)}, x2=${x2.toFixed(2)}, y2=${y2.toFixed(2)}, width=${(x2-x1).toFixed(2)}, height=${(y2-y1).toFixed(2)}`);

              candidates.push({
                  x1, y1, x2, y2,
                  confidence: maxConf,
                  classId: bestClass,
                  method: 'YOLOv5_2D'
              });
          }
      }
      return this.#nonMaxSuppression(candidates, iouThreshold);
    }
    
    console.warn("Unsupported YOLO output format:", output.dims);
    return [];
  }

  #inspectRawData(output) {
    console.log('\n--- Raw Data Analysis ---');

    const data = Array.from(output.data);
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const avgValue = data.reduce((a, b) => a + b, 0) / data.length;

    console.log('Max value in output:', maxValue);
    console.log('Min value in output:', minValue);
    console.log('Average value:', avgValue);

    const highValues = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i] > 0.1) {
        highValues.push({ index: i, value: data[i] });
      }
    }

    console.log('High values (>0.1):', highValues.slice(0, 20));

    if (output.dims.length === 2) {
      const [rows, cols] = output.dims;
      console.log(`2D output: ${rows} x ${cols}`);

      for (let r = 0; r < Math.min(5, rows); r++) {
        const rowData = data.slice(r * cols, (r + 1) * cols);
        const rowMax = Math.max(...rowData);
        console.log(`Row ${r} max value:`, rowMax);
      }
    }
  }

  #calculateIoU(box1, box2) {
    const x_overlap = Math.max(0, Math.min(box1.x2, box2.x2) - Math.max(box1.x1, box2.x1));
    const y_overlap = Math.max(0, Math.min(box1.y2, box2.y2) - Math.max(box1.y1, box2.y1));
    const intersection = x_overlap * y_overlap;

    const area1 = (box1.x2 - box1.x1) * (box1.y2 - box1.y1);
    const area2 = (box2.x2 - box2.x1) * (box2.y2 - box2.y1);
    const union = area1 + area2 - intersection;

    return union === 0 ? 0 : intersection / union;
  }

  #nonMaxSuppression(boxes, iouThreshold) {
    if (boxes.length === 0) return [];

    boxes.sort((a, b) => b.confidence - a.confidence);

    const selectedBoxes = [];
    const suppressed = new Array(boxes.length).fill(false);

    for (let i = 0; i < boxes.length; i++) {
      if (suppressed[i]) continue;

      selectedBoxes.push(boxes[i]);

      for (let j = i + 1; j < boxes.length; j++) {
        if (suppressed[j]) continue;

        if (boxes[i].classId === boxes[j].classId) {
          const iou = this.#calculateIoU(boxes[i], boxes[j]);
          if (iou > iouThreshold) {
            suppressed[j] = true;
          }
        }
      }
    }
    return selectedBoxes;
  }

  #drawDetections(ctx, detections) {
    detections.forEach((detection) => {
      const label = this.#trashClasses[detection.classId] || 'Unknown';
      const color = this.#classColors[label] || this.#classColors['Unknown'];

      const width = detection.x2 - detection.x1;
      const height = detection.y2 - detection.y1;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(detection.x1, detection.y1, width, height);

      ctx.font = '14px Arial';
      ctx.fillStyle = color;
      ctx.fillText(
        `${label} (${Math.round(detection.confidence * 100)}%)`,
        detection.x1,
        detection.y1 > 15 ? detection.y1 - 5 : detection.y1 + 15
      );
    });
  }

  async #addTakenPicture(image, base64 = null) {
    let blob = image;
    if (image instanceof String) {
      blob = await convertBase64ToBlob(image, 'image/png');
    }

    const imageElement = new Image();
    const imageUrl = URL.createObjectURL(blob);

    const classification = await new Promise((resolve) => {
      imageElement.onload = async () => {
        const result = await this.#classifyImage(imageElement);
        URL.revokeObjectURL(imageUrl);
        resolve(result);
      };
      imageElement.src = imageUrl;
    });

    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob,
      base64: base64,
      classification: classification,
    };

    this.#takenDocumentations = [...this.#takenDocumentations, newDocumentation];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations.reduce((accumulator, picture, currentIndex) => {
      const imageUrl = URL.createObjectURL(picture.blob);
      const { className, confidence, description } = picture.classification;

      return accumulator.concat(`
        <li class="new-form__documentations__outputs-item" data-itemId="${picture.id}">
          <div class="scan-results-image">
            <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}" />
          </div>
          <div class="scan-results-description">
            <p class="trash-type ${className === 'Organik' ? 'organik' : className === 'Anorganik' ? 'anorganik' : ''}">${className} (${confidence}%)</p>
            <p class="trash-description">${description}</p>
            <div class="scanner-delete-btn-container">
              <button class="scanner-delete-btn" data-deletepictureid="${picture.id}">Hapus</button>
            </div>
          </div>
        </li>
      `);
    }, '');

    document.getElementById('documentations-taken-list').innerHTML = html;

    document.querySelectorAll('button[data-deletepictureid]').forEach((button) =>
      button.addEventListener('click', (event) => {
        const pictureId = event.currentTarget.dataset.deletepictureid;
        this.#removePicture(pictureId);
        this.#populateTakenPictures();
        saveData(this.#takenDocumentations);
      })
    );
  }

  #removePicture(pictureId) {
    const initialLength = this.#takenDocumentations.length;
    this.#takenDocumentations = this.#takenDocumentations.filter((doc) => doc.id !== pictureId);
    return this.#takenDocumentations.length < initialLength;
  }

  #base64ToBlob(base64, mimeType) {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  }

  #fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  #blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  destroy() {
    if (this.#model) this.#model.dispose();
  }
}