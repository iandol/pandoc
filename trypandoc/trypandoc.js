"use strict";

var params = {
  text: '"hello *world*"',
  to: 'html5',
  from: 'markdown',
  standalone: false,
  citeproc: false,
  files: {} };

function permalink() {
  let href = window.location.href;
  const URLparams = new URLSearchParams(Object.entries(params));
  return href.replace(/([?].*)?$/,"?" + URLparams);
}

const binaryFormats = {
   docx: { extension: "docx",
           mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    odt: { extension: "odt",
           mime: "application/vnd.oasis.opendocument.text" },
    pptx: { extension: "pptx",
            mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
    epub:  { extension: "epub",
             mime: "application/epub+zip" },
    epub2: { extension: "epub",
             mime: "application/epub+zip" },
    epub3: { extension: "epub",
             mime: "application/epub+zip" }
};

const binaryMimeTypes = {
  ["application/epub+zip"]: true,
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]: true,
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation"]: true,
  ["application/vnd.oasis.opendocument.text"]: true
};

function paramsFromURL() {
  if (window.location.search.length > 0) {
    const uparams = new URLSearchParams(window.location.search);
    params.text = uparams.get("text") || "";
    params.from = uparams.get("from") || "markdown";
    params.to = uparams.get("to") || "html5";
    params.standalone = uparams.get("standalone") === "true";
    params.citeproc = uparams.get("citeproc") === "true";
  }
}

function handleErrors(response) {
    let errs = document.getElementById("errors");
    if (!response.ok) {
      errs.textContent = "Conversion failed, status = " + response.status;
      errs.style.display = "block";
    }
    if (response.status == 503) {
      errs.textContent += "  Timed out.";
    }
    return response;
}

function convert() {
    document.getElementById("results").textContent = "";
    let errs = document.getElementById("errors");
    errs.style.display = "none";
    errs.textContent = "";
    console.log(params);

    if (params.text && params.text != "") {
       let commandString = "pandoc"
         + " --from " + params.from + " --to " + params.to
         + (params.standalone ? " --standalone" : "")
         + (params.citeproc ? " --citeproc" : "") ;
       document.getElementById("command").textContent = commandString;
       fetch("/cgi-bin/pandoc-server.cgi", {
         method: "POST",
         headers: {"Content-Type": "application/json"},
         body: JSON.stringify(params)
        })
       .then(handleErrors)
       .then(response => response.text())
       .then(restext => {
            let binary = binaryFormats[params.to];
            if (binary &&
              document.getElementById("errors").style.display == "none") {
            document.getElementById("results").innerHTML +=
                '<a download="trypandoc.' + binary.extension +
                '" href="data:' + binary.mime + ';base64,' + restext +
                '">click to download trypandoc.' + binary.extension + '</a>';
          } else {
            document.getElementById("results").textContent += restext;
          }
          document.getElementById("permalink").href = permalink();
       });
    };
}

(function() {
    paramsFromURL();
    document.getElementById("text").value = params.text;
    document.getElementById("from").value = params.from;
    document.getElementById("to").value = params.to;
    document.getElementById("standalone").checked = params.standalone;
    document.getElementById("citeproc").checked = params.citeproc;

    document.getElementById("convert").onclick = convert;
    document.getElementById("from").onchange = (e) => {
      params.from = e.target.value;
      convert();
    }
    document.getElementById("to").onchange = (e) => {
      params.to = e.target.value;
      convert();
    }
    document.getElementById("text").onchange = (e) => {
      params.text = e.target.value;
    }
    document.getElementById("standalone").onchange = (e) => {
      params.standalone = e.target.checked;
      convert();
    }
    document.getElementById("citeproc").onchange = (e) => {
      params.citeproc = e.target.checked;
      convert();
    }

    document.getElementById("examples").onchange =
      (e => window.location.href = e.target.value );

    const fileInput = document.getElementById('loadfile');

    // Listen for the change event so we can capture the file
    fileInput.addEventListener('change', (e) => {
      // Get a reference to the file
      const file = e.target.files[0];
      const mimetype = file.type;
      let binary = binaryMimeTypes[mimetype];

      // Encode the file using the FileReader API
      const reader = new FileReader();
      let inputtext = document.getElementById("text");
      reader.onloadend = () => {
        // Use a regex to remove data url part
        if (binary) {
          const base64String = reader.result
           .replace('data:', '')
           .replace(/^.+,/, '');
          inputtext.value = base64String;
	} else {
          inputtext.value = reader.result;
        }
        params.text = inputtext.value;
      };
      if (binary) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    // const supportFiles = document.getElementById('supportfiles');
    //
    // // Listen for the change event so we can capture the file
    // supportFiles.addEventListener('change', (e) => {
    //   // Get a reference to the file
    //   const files = e.target.files;
    //   params.files = {};
    //   Object.keys(files).forEach(i => {
    //     const file = files[i];
    //     const reader = new FileReader();
    //     reader.onload = (e) => {
    //       params.files[file.name] = reader.result
    //        .replace('data:', '')
    //        .replace(/^.+,/, '');
    //     }
    //     reader.readAsDataURL(file);
    //   });
    // });

    fetch("/cgi-bin/pandoc-server.cgi/version")
       .then(handleErrors)
       .then(response => response.text())
       .then(restext =>
           document.getElementById("version").textContent = restext
         );

    convert();

})();
