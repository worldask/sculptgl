import TR from 'gui/GuiTR';
import { saveAs } from 'file-saver';
import { zip } from 'zip';
import Export from 'files/Export';
// import { SketchfabOAuth2 } from 'sketchfab-oauth2-1.0.0'; // webpack warning
var SketchfabOAuth2 = require('sketchfab-oauth2-1.0.0.js').SketchfabOAuth2;

class GuiFiles {

  constructor(guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._ctrlGui = ctrlGui;
    this._menu = null; // ui menu
    this._parent = guiParent;
    this.init(guiParent);
  }

  init(guiParent) {
    var menu = this._menu = guiParent.addMenu(TR('fileTitle'));

    // import
    menu.addTitle(TR('fileImportTitle'));
    menu.addButton(TR('fileAdd'), this, 'addFile' /*, 'CTRL+O/I'*/ );
    menu.addCheckbox(TR('fileAutoMatrix'), this._main, '_autoMatrix');
    menu.addCheckbox(TR('fileVertexSRGB'), this._main, '_vertexSRGB');

    // export
    menu.addTitle(TR('fileExportSceneTitle'));
    menu.addButton(TR('fileExportSGL'), this, 'saveFileAsSGL');
    menu.addButton(TR('fileExportOBJ'), this, 'saveFileAsOBJ' /*, 'CTRL+(Alt)+E'*/ );
    menu.addButton(TR('sketchfabTitle'), this, 'exportSketchfab');
    menu.addTitle(TR('fileExportMeshTitle'));
    menu.addButton(TR('fileExportPLY'), this, 'saveFileAsPLY');
    menu.addButton(TR('fileExportSTL'), this, 'saveFileAsSTL');
  }

  addFile() {
    document.getElementById('fileopen').click();
  }

  saveFileAsSGL() {
    if (this._main.getMeshes().length === 0) return;
    var blob = Export.exportSGL(this._main.getMeshes(), this._main);
    saveAs(blob, 'yourMesh.sgl');

    // 上传到服务器
    var fd = new FormData();
    fd.append('blob', blob);
    fd.append('contentType', false);
    fd.append('Content-Type', false);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', './save.php', true);
    xhr.send(fd);
  }

  saveFileAsOBJ(selection) {
    var meshes = this._main.getMeshes();
    if (meshes.length === 0) return;
    if (selection) {
      meshes = this._main.getSelectedMeshes();
      if (!meshes[0]) return;
    }
    var blob = Export.exportOBJ(meshes);
    saveAs(blob, 'yourMesh.obj');
  }

  saveFileAsPLY() {
    var mesh = this._main.getMesh();
    if (!mesh) return;

    zip.useWebWorkers = true;
    zip.workerScriptsPath = 'worker/';
    zip.createWriter(new zip.BlobWriter('application/zip'), function (zipWriter) {
      var data = Export.exportBinaryPLY(mesh);
      zipWriter.add('yourMesh.ply', new zip.BlobReader(data), function () {
        zipWriter.close(function (blob) {
          saveAs(blob, 'yourMesh.zip');
        });
      });
    }, onerror);

    // var blob = Export.exportBinaryPLY(mesh);
    // saveAs(blob, 'yourMesh.ply');
  }

  saveFileAsSTL() {
    var mesh = this._main.getMesh();
    if (!mesh) return;
    var blob = Export.exportBinarySTL(mesh);
    saveAs(blob, 'yourMesh.stl');
  }

  exportSketchfab() {
    var mesh = this._main.getMesh();
    if (!mesh)
      return;

    if (!window.sketchfabOAuth2Config)
      return;

    var ctrlNotif = this._ctrlGui.getWidgetNotification();
    if (this._sketchfabXhr && ctrlNotif.sketchfab === true) {
      if (!window.confirm(TR('sketchfabAbort')))
        return;
      ctrlNotif.sketchfab = false;
      this._sketchfabXhr.abort();
    }

    var client = new SketchfabOAuth2(window.sketchfabOAuth2Config);
    client.connect().then(function onSuccess(grant) {
      this._sketchfabXhr = Export.exportSketchfab(this._main, grant, ctrlNotif);
    }.bind(this)).catch(function onError(error) {
      console.error(error);
    });
  }

  ////////////////
  // KEY EVENTS
  ////////////////
  onKeyDown(event) {
    if (event.handled === true)
      return;

    event.stopPropagation();
    if (!this._main._focusGui)
      event.preventDefault();

    var key = event.which;
    if (event.ctrlKey && event.altKey && key === 78) { // N
      this._main.clearScene();
      event.handled = true;

    } else if (event.ctrlKey && (key === 79 || key === 73)) { // O or I
      this.addFile();
      event.handled = true;

    } else if (event.ctrlKey && key === 69) { // E
      this.saveFileAsOBJ(event.altKey);
      event.handled = true;
    }
  }
}

export default GuiFiles;
