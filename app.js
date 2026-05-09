
// =========================================================
// CONFIGURACIÓN: Reemplaza este ID con el ID de tu Google Sheet
// =========================================================
const SHEET_ID = '1iBxpJ-TK5TH6T9Ji2tYq_vIlckSxy9h0Ykc1Wa1OJhk'; // <--- ¡CAMBIA ESTO!
// =========================================================

function getCsvUrl(sheetName) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

// Parsear fechas en formato DD/MM/YYYY para ordenar
function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
}

async function loadSection(sheetName) {
    const container = document.getElementById('content');
    container.innerHTML = '<div class="loader">Cargando publicaciones... 🌊</div>';

    try {
        const response = await fetch(getCsvUrl(sheetName));
        if (!response.ok) throw new Error('Network response was not ok');
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                renderPosts(results.data, container);
            },
            error: function(error) {
                container.innerHTML = `<p style="color:red;">Error leyendo datos: ${error.message}</p>`;
            }
        });
    } catch (error) {
        container.innerHTML = `<p style="color:red;">Error de conexión. Asegúrate de que el Google Sheet esté compartido como "Cualquier persona con el enlace puede leer".</p>`;
        console.error(error);
    }
}

function renderPosts(data, container) {
    container.innerHTML = '';
    
    if (data.length === 0) {
        container.innerHTML = '<p>No hay publicaciones en esta sección todavía.</p>';
        return;
    }

    // Ordenar de más nuevo a más viejo
    const sortedData = data.sort((a, b) => {
        const dateA = parseDate(a['Date'] || a['Fecha']);
        const dateB = parseDate(b['Date'] || b['Fecha']);
        return dateB - dateA;
    });

    sortedData.forEach((row, index) => {
        // Extraer valores con posible diferencia de idioma en cabeceras
        const coverPhoto = row['Cover Photo'] || row['Foto Portada'];
        const date = row['Date'] || row['Fecha'];
        const title = row['Title'] || row['Titulo'];
        const description = row['Description'] || row['Descripcion'];
        
        const photo1 = row['Photo 1'] || row['Foto 1'];
        const photo2 = row['Photo 2'] || row['Foto 2'];
        const photo3 = row['Photo 3'] || row['Foto 3'];

        const carouselPhotos = [photo1, photo2, photo3].filter(p => p && p.trim() !== '');

        const article = document.createElement('article');
        article.className = 'post';

        let html = '';
        if (coverPhoto) {
            html += `<div class="post-cover"><img src="${coverPhoto}" alt="${title}"></div>`;
        }
        
        html += `<div class="post-content">`;
        if (date) html += `<span class="post-date">${date}</span>`;
        if (title) html += `<h2 class="post-title">${title}</h2>`;
        if (description) html += `<p class="post-description">${description}</p>`;

        // Añadir Carrusel si hay fotos extra
        if (carouselPhotos.length > 0) {
            const carouselId = `carousel-${index}`;
            html += `
            <div class="carousel-container" id="${carouselId}">
                <div class="carousel-slides" style="transform: translateX(0%);">
                    ${carouselPhotos.map(photo => `<div class="carousel-slide"><img src="${photo}" alt="Gallery photo"></div>`).join('')}
                </div>
                ${carouselPhotos.length > 1 ? `
                    <button class="carousel-btn prev" onclick="moveSlide('${carouselId}', -1, ${carouselPhotos.length})">❮</button>
                    <button class="carousel-btn next" onclick="moveSlide('${carouselId}', 1, ${carouselPhotos.length})">❯</button>
                ` : ''}
            </div>`;
        }
        
        html += `</div>`;
        article.innerHTML = html;
        container.appendChild(article);
    });
}

// Lógica de Carrusel
const carouselState = {};
function moveSlide(carouselId, direction, totalSlides) {
    if (!carouselState[carouselId]) {
        carouselState[carouselId] = 0;
    }
    carouselState[carouselId] += direction;
    
    if (carouselState[carouselId] >= totalSlides) carouselState[carouselId] = 0;
    if (carouselState[carouselId] < 0) carouselState[carouselId] = totalSlides - 1;

    const slidesContainer = document.querySelector(`#${carouselId} .carousel-slides`);
    slidesContainer.style.transform = `translateX(-${carouselState[carouselId] * 100}%)`;
}

// Cargar página Sobre Mi
async function loadAboutMe(sheetName) {
    const container = document.getElementById('content');
    container.innerHTML = '<div class="loader">Cargando perfil... 🌊</div>';

    try {
        const response = await fetch(getCsvUrl(sheetName));
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.data.length > 0) {
                    const data = results.data[0]; // Coger la primera línea
                    const photo = data['Photo'] || data['Foto'] || '';
                    const name = data['Name'] || data['Nombre'] || 'Mi Nombre';
                    const bio = data['Bio'] || data['Descripcion'] || '';

                    container.innerHTML = `
                        <div class="about-card">
                            ${photo ? `<img src="${photo}" class="about-photo" alt="${name}">` : ''}
                            <h2 class="about-name">${name}</h2>
                            <p class="about-bio">${bio}</p>
                        </div>
                    `;
                }
            }
        });
    } catch (error) {
        container.innerHTML = `<p style="color:red;">Error cargando Sobre Mi.</p>`;
    }
}
