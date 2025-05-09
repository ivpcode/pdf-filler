import { PDFDocument } from "pdf-lib";

class PdfViewerComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.form_data = {};
        this.pdf_file = "";
        this.debounceTimer = null;

        // Template HTML del componente
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    height: 100vh;
                    font-family: Roboto, sans-serif;
                }
                #left-panel {
                    width: 30%;
                    padding: 20px;
                    border-right: 1px solid #ccc;
                    box-sizing: border-box;
                    overflow-y: auto;
                }
                #right-panel {
                    flex-grow: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: #f9f9f9;
                }
                iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                #pdf-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                #pdf-form div {
                    display: flex;
                    flex-direction: column;
                }
                #pdf-form label {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                #pdf-form input {
                    padding: 8px;
                    font-size: 14px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    box-sizing: border-box;
                }
                #pdf-form input:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
                }
            </style>
            <div id="left-panel">
                <h1>Modifica i campi</h1>
                <form id="pdf-form"></form>
            </div>
            <div id="right-panel">
                <iframe id="pdf-frame" title="PDF Viewer" src="${this.pdf_file}"></iframe>
            </div>
        `;
    }

    connectedCallback() {
        this.shadowRoot.getElementById("pdf-frame").src = this.pdf_file
    }

    static get observedAttributes() {
        return ["form_data", "pdf_file"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "pdf_file") {
            this.shadowRoot.getElementById("pdf-frame").src = newValue;
        }

        if (name === "form_data") {
            this.generateFormFields();
            this.fillPdfForm();
        }
    }

    async setData(data) {
        this.form_data = data.form_data;
        this.pdf_file = data.pdf_file;
        await this.generateFormFields();
        this.fillPdfForm();
    }

    async generateFormFields() {
        const form = this.shadowRoot.getElementById("pdf-form");
        form.innerHTML = ""; // Pulisci il contenuto esistente

        const response = await fetch("/file.pdf");
        const pdfBytes = await response.arrayBuffer();

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pdf_form = pdfDoc.getForm();

        Object.entries(this.form_data).forEach(([key, field]) => {
            const label = document.createElement("label");
            label.textContent = key;
            label.setAttribute("for", key);
            const value = field.value

            let type = value
            const pdf_field = pdf_form.getField(key);
            console.log(pdf_field.constructor.name)
            if (pdf_field.constructor.name === "PDFCheckBox" ||
                pdf_field.constructor.name === "PDFCheckBox2"
            ) {
                type = true
            } else {
                type = "text"
            }

            let input;
            if (typeof type === "boolean") {
                input = document.createElement("input");
                input.type = "checkbox";
                input.id = key;
                input.name = key;
                input.checked = value;

                input.addEventListener("change", (e) => {
                    this.form_data[key].value = e.target.checked;
                    clearTimeout(this.debounceTimer);
                    this.debounceTimer = setTimeout(() => this.fillPdfForm(), 1000);
                });
            } else {
                input = document.createElement("input");
                input.type = "text";
                input.id = key;
                input.name = key;
                input.value = value;

                input.addEventListener("input", (e) => {
                    this.form_data[key].value = e.target.value;
                    clearTimeout(this.debounceTimer);
                    this.debounceTimer = setTimeout(() => this.fillPdfForm(), 1000);
                });
            }

            const div = document.createElement("div");
            div.appendChild(label);
            div.appendChild(input);
            form.appendChild(div);
        });
    }

    async fillPdfForm() {
        try {
            const response = await fetch("/file.pdf");
            const pdfBytes = await response.arrayBuffer();

            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();

            Object.entries(this.form_data).forEach(([fieldName, value]) => {
                try {
                    const field = form.getField(fieldName);
                    console.log(`${fieldName}: ${value.value}`)
                    if (field.constructor.name === "PDFCheckBox" ||
                        field.constructor.name === "PDFCheckBox2"
                    ) {
                        if (value.value) {
                            field.check();
                        } else {
                            field.uncheck();
                        }
                    } else {
                        field.setText(value.value);
                    }
                } catch (error) {
                    console.warn(`Campo non trovato o non gestito: ${fieldName}`);
                }
            });

            form.flatten();

            const filledPdfBytes = await pdfDoc.save();
            const pdfViewer = this.shadowRoot.getElementById("pdf-frame");
            pdfViewer.src = URL.createObjectURL(new Blob([filledPdfBytes], { type: "application/pdf" }));
        } catch (error) {
            console.error("Errore durante il riempimento del PDF:", error);
        }
    }


}

customElements.define("pdf-viewer", PdfViewerComponent);