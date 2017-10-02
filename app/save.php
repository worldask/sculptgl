<?php
if ($_FILES["blob"]["error"] == UPLOAD_ERR_OK) {
  $tmp_name = $_FILES["blob"]["tmp_name"];
  move_uploaded_file($tmp_name, "./files/3.sgl");
}
