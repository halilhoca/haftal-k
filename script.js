document.addEventListener('DOMContentLoaded', () => {
    // Başlangıçta verileri yükle ve arayüzü hazırla
    loadStudents();
    loadBooks();
    updateStudentSelects(); // Tüm öğrenci seçme kutularını günceller

    // Form gönderimlerini ve önemli olayları dinle
    document.getElementById('ogrenci-ekle-form').addEventListener('submit', addStudent);
    document.getElementById('kitap-ekle-form').addEventListener('submit', addBookToStudent);
    document.getElementById('program-olustur-form').addEventListener('submit', saveProgramAndGenerateLink_TaskBased);

    // Program oluşturmadaki öğrenci seçimi değiştiğinde, kitap selectlerini güncelle
    document.getElementById('program-ogrenci-sec').addEventListener('change', handleProgramStudentChange_TaskBased);

    // "Görev Ekle" butonlarına olay dinleyicileri ekle
    setupAddTaskButtons();

    // Başlangıçta program formunu temizle (isteğe bağlı)
    // clearProgramForm();
});

// --- Genel Yardımcı Fonksiyonlar ---

/** LocalStorage'dan öğrenci listesini alır. */
function getStudents() { return JSON.parse(localStorage.getItem('students')) || []; }
/** Öğrenci listesini LocalStorage'a kaydeder. */
function saveStudents(students) { localStorage.setItem('students', JSON.stringify(students)); }
/** LocalStorage'dan kitap listesini alır. */
function getBooks() { return JSON.parse(localStorage.getItem('books')) || []; }
/** Kitap listesini LocalStorage'a kaydeder. */
function saveBooks(books) { localStorage.setItem('books', JSON.stringify(books)); }
/** Verilen ID'ye sahip öğrencinin adını döndürür. */
function getStudentNameById(studentId) {
    const student = getStudents().find(s => s.id === studentId);
    return student ? student.name : 'Bilinmeyen Öğrenci';
}
/** Verilen ID'ye sahip kitabı döndürür. */
function getBookById(bookId) { return getBooks().find(b => b.id === bookId) || null; }

// --- Sekme (Tab) Yönetimi ---

/** Belirtilen ID'ye sahip bölümü gösterir, diğerlerini gizler. */
function showSection(sectionId) {
    document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.classList.add('active');
    } else {
        console.error(`Bölüm bulunamadı: ${sectionId}`);
        // Güvenlik olarak ilk sekmeyi göster
        const firstTab = document.querySelector('.tab-content');
        if (firstTab) firstTab.classList.add('active');
    }
}

// --- Öğrenci Yönetimi ---

/** Öğrenci ekleme formunu işler. */
function addStudent(event) {
    event.preventDefault();
    const studentNameInput = document.getElementById('ogrenci-adi');
    const studentName = studentNameInput.value.trim();
    if (studentName) {
        const students = getStudents();
        const newStudent = { id: Date.now().toString(), name: studentName };
        students.push(newStudent);
        saveStudents(students);
        renderStudents();
        updateStudentSelects();
        studentNameInput.value = '';
        alert(`"${studentName}" başarıyla eklendi.`);
    } else { alert("Lütfen geçerli bir öğrenci adı giriniz."); }
}

/** Belirtilen ID'ye sahip öğrenciyi ve ilişkili kitaplarını siler. */
function deleteStudent(studentId) {
    const studentName = getStudentNameById(studentId);
    if (!confirm(`${studentName} adlı öğrenciyi silmek istediğinizden emin misiniz? Bu öğrenciye ait tüm kitaplar da silinecektir.`)) return;

    // Öğrenciyi sil
    let students = getStudents().filter(student => student.id !== studentId);
    saveStudents(students);

    // İlişkili kitapları sil
    deleteBooksByStudentId(studentId);

    // Arayüzü güncelle
    renderStudents();
    renderBooks();
    updateStudentSelects();
    // Program formu seçiliyse temizle
    if (document.getElementById('program-ogrenci-sec').value === studentId) {
        clearProgramForm();
    }
    alert(`${studentName} ve ilişkili kitapları silindi.`);
}

/** Öğrenci listesini HTML'de render eder. */
function renderStudents() {
    const studentList = document.getElementById('ogrenci-listesi');
    studentList.innerHTML = '';
    const students = getStudents();
    if (students.length === 0) {
        studentList.innerHTML = '<li>Kayıtlı öğrenci bulunmamaktadır.</li>'; return;
    }
    students.forEach(student => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${student.name}</span> <button onclick="deleteStudent('${student.id}')" title="Öğrenciyi Sil">Sil</button>`;
        studentList.appendChild(li);
    });
}

/** Sayfa yüklendiğinde öğrenci listesini yükler. */
function loadStudents() { renderStudents(); }

// --- Kitap Yönetimi ---

/** Kitap ekleme formunu işler ve kitabı seçilen öğrenciye atar. */
function addBookToStudent(event) {
    event.preventDefault();
    const studentId = document.getElementById('kitap-ogrenci-sec').value;
    const bookNameInput = document.getElementById('kitap-adi');
    const bookAuthorInput = document.getElementById('kitap-yazari');
    const bookName = bookNameInput.value.trim();
    const bookAuthor = bookAuthorInput.value.trim();

    if (!studentId) { alert("Lütfen kitabı eklemek istediğiniz öğrenciyi seçin."); return; }
    if (!bookName) { alert("Lütfen kitap adı giriniz."); return; }

    const books = getBooks();
    const newBook = { id: Date.now().toString(), title: bookName, author: bookAuthor, studentId: studentId };
    books.push(newBook);
    saveBooks(books);
    renderBooks();

    bookNameInput.value = '';
    bookAuthorInput.value = '';
    alert(`"${bookName}" kitabı ${getStudentNameById(studentId)} adlı öğrenciye başarıyla eklendi.`);
    // Programdaki selectleri de güncelle (eğer aynı öğrenci seçiliyse)
    if (document.getElementById('program-ogrenci-sec').value === studentId) {
         populateAllTaskBookSelects(studentId);
    }
}

/** Belirtilen ID'ye sahip kitabı siler. */
function deleteBook(bookId) {
    let books = getBooks();
    const bookToDelete = books.find(b => b.id === bookId);
    if (!bookToDelete) return;
    if (!confirm(`"${bookToDelete.title}" (${getStudentNameById(bookToDelete.studentId)}) adlı kitabı silmek istediğinizden emin misiniz?`)) return;

    books = books.filter(book => book.id !== bookId);
    saveBooks(books);
    renderBooks();
    // Programdaki selectleri de güncelle
    populateAllTaskBookSelects(document.getElementById('program-ogrenci-sec').value);
    alert(`"${bookToDelete.title}" kitabı silindi.`);
}

/** Belirli bir öğrenciye ait tüm kitapları siler. */
function deleteBooksByStudentId(studentId) {
     let books = getBooks();
     const initialLength = books.length;
     books = books.filter(book => book.studentId !== studentId);
     if (books.length < initialLength) {
        saveBooks(books);
        console.log(`${getStudentNameById(studentId)} (${studentId}) adlı öğrenciye ait kitaplar silindi.`);
     }
}

/** Kitap listesini öğrenci bilgisiyle HTML'de render eder. */
function renderBooks() {
    const bookList = document.getElementById('kitap-listesi');
    bookList.innerHTML = '';
    const books = getBooks();
    if (books.length === 0) {
        bookList.innerHTML = '<li>Kayıtlı kitap bulunmamaktadır.</li>'; return;
    }
    // Öğrenci adına göre sırala
    books.sort((a, b) => {
        const nameA = getStudentNameById(a.studentId).toLowerCase();
        const nameB = getStudentNameById(b.studentId).toLowerCase();
        if (nameA < nameB) return -1; if (nameA > nameB) return 1;
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    });
    books.forEach(book => {
        const studentName = getStudentNameById(book.studentId);
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${book.title}</strong> ${book.author ? `(${book.author})` : ''} <span class="ogrenci-bilgisi">- ${studentName}</span></span>
            <button onclick="deleteBook('${book.id}')" title="Kitabı Sil">Sil</button>`;
        bookList.appendChild(li);
    });
}

/** Sayfa yüklendiğinde kitap listesini yükler. */
function loadBooks() { renderBooks(); }

// --- Seçim (Select) Kutularını Güncelleme ---

/** Sayfadaki tüm öğrenci seçme dropdown'larını güncel öğrenci listesiyle doldurur. */
function updateStudentSelects() {
    const students = getStudents();
    const selects = document.querySelectorAll('select[id*="-ogrenci-sec"]');
    selects.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        const defaultOption = select.options[0] && select.options[0].value === "" ? select.options[0].cloneNode(true) : null;
        select.innerHTML = '';
        if (defaultOption) {
            select.appendChild(defaultOption);
        } else {
             const placeholder = document.createElement('option');
             placeholder.value = ""; placeholder.textContent = "-- Öğrenci Seçin --";
             placeholder.disabled = true; placeholder.selected = true;
             select.appendChild(placeholder);
        }
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id; option.textContent = student.name;
            select.appendChild(option);
        });
        // Eski değeri geri yükle veya sıfırla
        if (students.some(s => s.id === currentValue)) {
            select.value = currentValue;
        } else {
            select.value = "";
            if (select.id === 'program-ogrenci-sec') clearProgramForm(); // Program formuysa temizle
        }
    });
}

// --- Program Oluşturma (Görev Bazlı) ---

/** Program Oluşturma sekmesindeki öğrenci seçimi değiştiğinde kitap selectlerini günceller. */
function handleProgramStudentChange_TaskBased() {
    const selectedStudentId = document.getElementById('program-ogrenci-sec').value;
    // Mevcut görevlerin selectlerini güncelle
    populateAllTaskBookSelects(selectedStudentId);
    // Yeni görev eklenirse doğru kitapların gelmesi için studentId'yi bilmek yeterli.
}

/** Sayfadaki tüm görev ekleme butonlarına olay dinleyicisi atar. */
function setupAddTaskButtons() {
    document.querySelectorAll('.gorev-ekle-buton').forEach(button => {
        button.addEventListener('click', (event) => {
            const day = event.target.dataset.day;
            addTaskToDay(day);
        });
    });
    // Dinamik olarak eklenen sil butonları için olay delegasyonu da kullanılabilir,
    // ancak şimdilik her eklemede direkt atama yapıyoruz.
}

/** Belirli bir güne yeni bir görev bloğu ekler. */
function addTaskToDay(day) {
    const template = document.getElementById('gorev-template');
    const taskListDiv = document.getElementById(`gorev-listesi-${day}`);
    if (!template || !taskListDiv) { console.error("Template veya görev listesi bulunamadı:", day); return; }

    const newTask = template.content.cloneNode(true).querySelector('.gorev-item');
    // Sil butonuna olay dinleyicisi
    newTask.querySelector('.gorev-sil-buton').addEventListener('click', () => newTask.remove());
    // Kitap select kutusunu doldur
    populateSingleBookSelect(newTask.querySelector('.gorev-kitap-sec'), document.getElementById('program-ogrenci-sec').value);
    taskListDiv.appendChild(newTask);
}

/** Belirli bir select kutusunu seçilen öğrencinin kitaplarıyla doldurur. */
function populateSingleBookSelect(select, studentId) {
    if (!select) return;
    select.innerHTML = '<option value="">-- Kitap Seç --</option>';
    select.disabled = true;
    if (!studentId) {
        select.insertAdjacentHTML('beforeend', '<option value="" disabled>-- Önce Öğrenci Seçin --</option>');
        return;
    }
    const studentBooks = getBooks().filter(book => book.studentId === studentId);
    if (studentBooks.length > 0) {
        select.disabled = false;
        studentBooks.forEach(book => select.add(new Option(book.title, book.id)));
    } else {
        select.insertAdjacentHTML('beforeend', '<option value="" disabled>-- Öğrencinin kitabı yok --</option>');
    }
}

/** Program oluşturma formundaki tüm görevlerin kitap selectlerini günceller. */
function populateAllTaskBookSelects(studentId) {
     document.querySelectorAll('#program-olustur .gorev-kitap-sec').forEach(select => {
         populateSingleBookSelect(select, studentId);
     });
}

/** Program oluşturma formunu temizler. */
function clearProgramForm() {
    const form = document.getElementById('program-olustur-form');
    if (form) {
        form.reset(); // Inputları sıfırlar (week, select)
        document.querySelectorAll('.gorev-listesi').forEach(list => list.innerHTML = ''); // Görevleri temizle
        document.getElementById('program-ogrenci-sec').value = ''; // Öğrenci seçimini sıfırla
    }
    document.getElementById('program-link-alani').style.display = 'none'; // Link alanını gizle
}

/** Program oluşturma formunu işler (GÖREV BAZLI), verileri toplar ve link oluşturur. */
function saveProgramAndGenerateLink_TaskBased(event) {
    event.preventDefault();
    const studentId = document.getElementById('program-ogrenci-sec').value;
    const programWeek = document.getElementById('program-tarih').value;

    if (!studentId) { alert("Lütfen program oluşturulacak öğrenciyi seçin."); return; }
    if (!programWeek) { alert("Lütfen program haftasını seçin."); return; }

    const programData = { studentId, studentName: getStudentNameById(studentId), week: programWeek, days: {} };
    const daysOfWeek = ["pazartesi", "sali", "carsamba", "persembe", "cuma", "cumartesi", "pazar"];
    let totalTasks = 0;

    daysOfWeek.forEach(day => {
        programData.days[day] = []; // Gün için boş dizi başlat
        const taskItems = document.querySelectorAll(`#gorev-listesi-${day} .gorev-item`);
        taskItems.forEach((taskItem, index) => {
            const description = taskItem.querySelector('.gorev-aciklama').value.trim();
            if (!description) return; // Boş görevleri atla

            const bookSelect = taskItem.querySelector('.gorev-kitap-sec');
            const bookId = bookSelect.value || null;
            const book = bookId ? getBookById(bookId) : null;
            // Benzersiz ve tahmin edilebilir Task ID (program hafta, gün, sıra no)
            const taskId = `task_${programWeek}_${day}_${index + 1}`;

            programData.days[day].push({ taskId, bookId, bookTitle: book?.title, description });
            totalTasks++;
        });
        // Görev yoksa null yap
        if (programData.days[day].length === 0) programData.days[day] = null;
    });

    if (totalTasks === 0) { alert("Lütfen en az bir gün için görev ekleyin."); return; }

    // Link Oluşturma
    try {
        const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(programData))));
        const studentViewUrl = `student-view.html#${encodedData}`;
        const linkElement = document.getElementById('program-linki');
        linkElement.href = studentViewUrl; linkElement.textContent = studentViewUrl;
        document.getElementById('program-link-alani').style.display = 'block';
        alert("Program başarıyla 'simüle edilerek' kaydedildi ve link oluşturuldu.");
        // clearProgramForm(); // Opsiyonel: Formu temizle
    } catch (error) {
        console.error("Link oluşturma hatası:", error);
        alert("Program linki oluşturulurken bir hata oluştu.");
        document.getElementById('program-link-alani').style.display = 'none';
    }
}