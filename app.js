// =========================================================
// CONFIGURACIÓN
// =========================================================
const SHEET_ID = '1iBxpJ-TK5TH6T9Ji2tYq_vIlckSxy9h0Ykc1Wa1OJhk'; 

/**
 * Función mágica para convertir enlaces de visualización 
 * (como los de Google Drive) en enlaces de imagen directa.
 */
function fixImageUrl(url) {
    if (!url) return '';
    url = url.trim();

    // Lógica para Google Drive
    if (url.includes('drive.google.com')) {
        let fileId = '';
        if (url.includes('/d/')) {
            fileId = url.split('/d/')[1].split('/')[0];
        } else if (url.includes('id=')) {
            fileId = url.split('id=')[1].split('&')[0];
        }
        return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
    }

    // Lógica para Dropbox
    if (url.includes('dropbox.com')) {
        return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }

    return url;
}

function getCsvUrl(sheetName) {
    const baseUri = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    // Proxy para evitar errores de CORS (crucial para GitHub y local)
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUri)}`;
}

async function loadSection(sheetName) {
    const container = document.getElementById('content');
    container.innerHTML = '<div class="loader">Buscando tesoros en el mar... 🌊</div>';

    try {
        const response = await fetch(getCsvUrl(sheetName));
        if (!response.ok) throw new Error('Error de red');
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                renderPosts(results.data, container);
            }
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="text-align:center; padding: 2rem;">Error al conectar con los datos. <br> Revisa que el Sheet esté "Publicado en la web".</p>`;
    }
}

function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr);
}

function renderPosts(data, container) {
    container.innerHTML = '';
    
    // Filtrar filas vacías (donde no hay título)
    const validData = data.filter(row => row['Title'] || row['Titulo']);

    if (validData.length === 0) {
        container.innerHTML = '<p style="text-align:center;">No hay publicaciones en esta sección todavía. 🌴</p>';
        return;
    }

    // Ordenar: Más reciente primero
    validData.sort((a, b) => {
        return parseDate(b['Date'] || b['Fecha']) - parseDate(a['Date'] || a['Fecha']);
    });

    validData.forEach((row, index) => {
        const title = row['Title'] || row['Titulo'] || 'Sin título';
        const description = row['Description'] || row['Descripcion'] || '';
        const date = row['Date'] || row['Fecha'] || '';
        
        // Corregir URLs de imágenes
        const coverPhoto = fixImageUrl(row['Cover Photo'] || row['Foto Portada']);
        const photo1 = fixImageUrl(row['Photo 1'] || row['Foto 1']);
        const photo2 = fixImageUrl(row['Photo 2'] || row['Foto 2']);
        const photo3 = fixImageUrl(row['Photo 3'] || row['Foto 3']);

        const carouselPhotos = [photo1, photo2, photo3].filter(p => p !== '');

        const article = document.createElement('article');
        article.className = 'post';

        let html = '';
        if (coverPhoto) {
            html += `<div class="post-cover"><img src="${coverPhoto}" alt="${title}" onerror="this.src='https://via.placeholder.com/800x400?text=Imagen+no+encontrada'"></div>`;
        }
        
        html += `<div class="post-content">`;
        if (date) html += `<span class="post-date">${date}</span>`;
        html += `<h2 class="post-title">${title}</h2>`;
        html += `<p class="post-description">${description}</p>`;

        if (carouselPhotos.length > 0) {
            const cId = `carousel-${index}`;
            html += `
            <div class="carousel-container" id="${cId}">
                <div class="carousel-slides">
                    ${carouselPhotos.map(p => `<div class="carousel-slide"><img src="${p}" onerror="this.style.display='none'"></div>`).join('')}
                </div>
                ${carouselPhotos.length > 1 ? `
                    <button class="carousel-btn prev" onclick="moveSlide('${cId}', -1, ${carouselPhotos.length})">❮</button>
                    <button class="carousel-btn next" onclick="moveSlide('${cId}', 1, ${carouselPhotos.length})">❯</button>
                ` : ''}
            </div>`;
        }
        
        html += `</div>`;
        article.innerHTML = html;
        container.appendChild(article);
    });
}

// Lógica de movimiento del carrusel
const carouselState = {};
function moveSlide(cId, dir, total) {
    if (carouselState[cId] === undefined) carouselState[cId] = 0;
    carouselState[cId] = (carouselState[cId] + dir + total) % total;
    const slides = document.querySelector(`#${cId} .carousel-slides`);
    slides.style.transform = `translateX(-${carouselState[cId] * 100}%)`;
}

// Cargar Datos de "Sobre Mi"
async function loadAboutMe(sheetName) {
    const container = document.getElementById('content');
    try {
        const response = await fetch(getCsvUrl(sheetName));
        const csvText = await response.text();
        Papa.parse(csvText, {
            header: true,
            complete: function(results) {
                if (results.data.length > 0) {
                    const d = results.data[0];
                    const photo = fixImageUrl(d['Photo'] || d['Foto']);
                    container.innerHTML = `
                        <div class="about-card">
                            ${photo ? `<img src="${photo}" class="about-photo">` : ''}
                            <h2 class="about-name">${d['Name'] || d['Nombre'] || 'Mi Perfil'}</h2>
                            <p class="about-bio">${d['Bio'] || d['Descripcion'] || ''}</p>
                        </div>`;
                }
            }
        });
    } catch (e) {
        container.innerHTML = '<p>Error al cargar el perfil.</p>';
    }
}