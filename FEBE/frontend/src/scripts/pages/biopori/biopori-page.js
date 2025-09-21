export default class BioporePage {

  async render() {
    return `
      <section id="biopori" class="biopori background-section">
        <div class="biopori-container">
          <h1 class="section-title">Biopori</h1>
          <div id="biopori-header" class="biopori-header"></div>
          <div class="biopori-line"></div>
          <div class="biopori-body">
            <div class="biopori-button-container">
              <div class="biopori-services-button-container">
                <button id="biopori-pembelian-button" class="biopori-pembelian-button button service-button-active">Pembelian</button>
                <button id="biopori-pemasangan-button" class="biopori-pemasangan-button button">Pemasangan</button>
              </div>

              <div class="biopori-quantity-button-container">
                <button id="decrement-button" class="decrement-button">-</button>
                <span id="quantity" class="quantity">1</span>
                <button id="increment-button" class="increment-button">+</button>
              </div>
            </div>

            <div class="biopori-stars-container">
              <i class="bx bxs-star"></i>
              <i class="bx bxs-star"></i>
              <i class="bx bxs-star"></i>
              <i class="bx bxs-star"></i>
              <i class="bx bxs-star"></i>
            </div>

            <div class="biopori-details-container">
              <div id="biopori-details__price" class="biopori-details__price"></div>

              <div class="biopori-details__description">
                <h3>Deskripsi</h3>
                <p id="biopori-details__paragraph" class="biopori-details__paragraph description"></p>
              </div>

              <div id="biopori-details__spesification" class="biopori-details__spesification"></div>
            </div>
          </div>
          <button id="order-now-button" class="order-now-button button green-button">Pesan Sekarang</button>
        </div>
      </section>
    `
  }
  
  async afterRender() {
    const quantityContainer = document.querySelector('.biopori-quantity-button-container');

    const incrementButton = document.getElementById('increment-button');
    const decrementButton = document.getElementById('decrement-button');
    const quantityElement = document.getElementById('quantity');
    
    const bioporiImage = document.getElementById('biopori-header');
    const priceElement = document.getElementById('biopori-details__price');

    const pembelianButton = document.getElementById('biopori-pembelian-button');
    const pemasanganButton = document.getElementById('biopori-pemasangan-button');

    const descriptionText = document.getElementById('biopori-details__paragraph');
    const spesificationProduct = document.getElementById('biopori-details__spesification');

    let quantity = parseInt(quantityElement.textContent);
    let basePrice;

    const updateContent = () => {
      if (pembelianButton.classList.contains('service-button-active')) {
        bioporiImage.innerHTML = `
          <img src="images/bioporePageImages/bioporePipeImage.png" alt="biopori pipe image"/>
        `

        basePrice = 20000;
        quantityContainer.style.display = 'flex';
        
        descriptionText.textContent = `
          Nikmati kemudahan membeli pipa biopori berkualitas tinggi yang dirancang khusus untuk resapan air dan pengolahan sampah organik. Cocok untuk penggunaan rumah tangga, sekolah, maupun perkantoran.
        `;
        spesificationProduct.innerHTML = `
          <h3>Spesifikasi</h3>
          <ul>
            <li>Berbahan PVC, tahan terhadap cuaca dan kelembaban tanah</li>
            <li>Panjang 100 cm (1 meter), sesuai kedalaman umum lubang biopori</li>
            <li>Diameter 10 cm untuk rumah tangga, dan 15 cm untuk area besar atau komunal</li>
            <li>Ketebalan dinding pipa 2 mm</li>
            <li>Terdapat lubang-lubang kecil berdiameter ±1 cm di sepanjang sisi pipa dengan jarak antar lubang: ±5-10 cm</li>
            <li>Tutup berbahan plastik atau logam ringan dengan lubang udara</li>
          </ul>
        `
      } else if (pemasanganButton.classList.contains('service-button-active')) {
        bioporiImage.innerHTML = `
          <img src="images/bioporePageImages/bioporePlantingImage.png" alt="biopori planting image"/>
        `

        basePrice = 100000;
        
        descriptionText.textContent = `
          Layanan pemasangan biopori profesional yang cepat dan tepat. Solusi ideal untuk mengurangi genangan air dan mendukung pelestarian lingkungan.
        `;
        spesificationProduct.innerHTML = `
          <h3>Layanan yang ditawarkan</h3>
          <ul>
            <li>Survey lokasi (Pemeriksaan kondisi tanah, kemiringan lahan, dan kebutuhan jumlah lubang biopori).</li>
            <li>Pengeboran lubang sesuai standar (kedalaman ±100 cm, diameter ±10-15 cm).</li>
            <li>Pemasangan pipa atau cincin beton untuk melindungi dinding lubang biopori agar tidak runtuh dan tetap stabil.</li>
            <li>Mengisi lubang dengan sampah organik (daun kering, sisa dapur, dll.) sebagai starter kompos.</li>
            <li>Pemasangan penutup biopori untuk menjaga keamanan dan kebersihan lubang (mencegah masuknya benda asing atau kecelakaan).</li>
            <li>Pemasangan penutup biopori untuk menjaga keamanan dan kebersihan lubang (mencegah masuknya benda asing atau kecelakaan).</li>
            <li>Edukasi konsumen mengenai cara merawat dan mengisi ulang lubang biopori.</li>
          </ul>
        `
      } 
    };

    const updatePrice = () => {
      updateContent();
      const totalPrice = basePrice * quantity;
      priceElement.innerHTML = `<h2>Rp${totalPrice.toLocaleString('id-ID')}</h2>`;
    };

    incrementButton.addEventListener('click', () => {
      quantity++;
      quantityElement.textContent = quantity;
      updatePrice();
    });

    decrementButton.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        quantityElement.textContent = quantity;
        updatePrice();
      }
    });

    const serviceButtons = document.querySelectorAll('.biopori-services-button-container .button');

    serviceButtons.forEach(button => {
      button.addEventListener('click', () => {
        serviceButtons.forEach(btn => btn.classList.remove('service-button-active'));
        button.classList.add('service-button-active');

        quantity = 1;
        quantityElement.textContent = quantity;

        updatePrice();
      });
    });

    updatePrice();
    this.orderButtonEventListener();
  }

  orderButtonEventListener() {
    document.getElementById('order-now-button').addEventListener('click', () => {
      alert('Fitur pemesanan belum tersedia!');
    });
  }
}