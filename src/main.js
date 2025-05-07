import axios from "axios";
import { PDFDocument } from "pdf-lib";

    let formData = {
    nome: "Mario",
    cognome: "Rossi",
    luogo_di_nascita: "Roma",
    provincia_di_nascita: "RM",
    data_di_nascita: "01/01/1980",
    ruolo: "Amministratore",
    nome_societa: "Società Srl",          
    sede_legale: "Via Roma 1",
    provincia_sede: "RM",
    indirizzo_sede: "Via Milano",
    numero_civico: "10",
    cap: "00100",
    codice_fiscale_1: "RSSMRA80A01H501Z",
    codice_ateco: "12345",
    numero_telefono: "1234567890",
    numero_fax: "0987654321",
    email: "mario.rossi@example.com",
    pec: "mario.rossi@pec.it",
    numero_contratto: "123456",
    codice_fiscale_2: "RSSMRA80A01H501Z",
    codice_pod: "IT001E123456789",
    numero_condomini: "5",
    data: "06/05/2025",
    Testo2: "Partita IVA",
    singolo_condominio: true,
    molti_condomini: false
    };
    let debounceTimer; 

    function generateFormFields() {
        const form = document.getElementById("pdf-form");
        form.innerHTML = ""; 

        Object.entries(formData).forEach(([key, value]) => {
            const label = document.createElement("label");
            label.textContent = key;
            label.setAttribute("for", key);
    
            // Determina il tipo di input
            let input;
            if (typeof value === "boolean") {
                // Se il valore è booleano, usa una checkbox
                input = document.createElement("input");
                input.type = "checkbox";
                input.id = key;
                input.name = key;
                input.checked = value;
    
                input.addEventListener("change", (e) => {
                    formData[key] = e.target.checked;
    
                    clearTimeout(debounceTimer);
    
                    debounceTimer = setTimeout(() => {
                        fillPdfForm();
                    }, 1000);
                });
            } else {
                // Altrimenti, usa un input di testo
                input = document.createElement("input");
                input.type = "text";
                input.id = key;
                input.name = key;
                input.value = value;
    
                input.addEventListener("input", (e) => {
                    formData[key] = e.target.value;
    
                    clearTimeout(debounceTimer);
    
                    debounceTimer = setTimeout(() => {
                        fillPdfForm();
                    }, 1000);
                });
            }

            const div = document.createElement("div");
            div.appendChild(label);
            div.appendChild(input);
            form.appendChild(div);
        });
    }
    
    async function fillPdfForm() {
        try {
            const response = await axios.get("/file.pdf", { responseType: "arraybuffer" });
            const pdfBytes = response.data;
    
            // Carica il PDF
            const pdfDoc = await PDFDocument.load(pdfBytes);
    
            // Ottieni il modulo dal PDF
            const form = pdfDoc.getForm();
    
            // Compila i campi del modulo
            Object.entries(formData).forEach(([fieldName, value]) => {
                try {
                    const field = form.getField(fieldName);
    
                    if (field.constructor.name === "PDFCheckBox" ||
                        field.constructor.name === "PDFCheckBox2"
                    ) {
                        if (value) {
                            field.check();
                        } else {
                            field.uncheck();
                        }
                    } else  {
                        field.setText(value);
                    }
                } catch (error) {
                    console.warn(`Campo non trovato o non gestito: ${fieldName}`);
                }
            });
    
            form.flatten();

            // Salva il PDF modificato
            const filledPdfBytes = await pdfDoc.save();
    
            const pdfViewer = document.getElementById("pdf-frame");
            pdfViewer.src = URL.createObjectURL(new Blob([filledPdfBytes], { type: "application/pdf" }));
        } catch (error) {
            console.error("Errore durante il riempimento del PDF:", error);
        }
    }

generateFormFields();

window.fillPdfForm = fillPdfForm