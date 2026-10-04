const fs = require('fs');

const psScript = `
Add-Type -AssemblyName System.Drawing
$src = "C:/Users/Jack/.gemini/antigravity/brain/fee1d325-aa24-4d82-877c-688a94ebca4d/.user_uploaded/media_1791049232848.png"
$dest = "c:/Users/Jack/Desktop/cultura votação/public/logo-cultura-vermelho.png"

$bmp = New-Object System.Drawing.Bitmap($src)
$width = $bmp.Width
$height = $bmp.Height

for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -gt 230 -and $p.G -gt 230 -and $p.B -gt 230) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, 229, 9, 20))
        }
    }
}

$bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "PNG_DONE"
`;

fs.writeFileSync('c:/Users/Jack/Desktop/cultura votação/scratch/recolor.ps1', psScript);
