Add-Type -AssemblyName System.Drawing
$src = "C:\Users\Jack\.gemini\antigravity\brain\fee1d325-aa24-4d82-877c-688a94ebca4d\.user_uploaded\media_1791049232848.png"
$tmpDest = "C:\Users\Jack\Desktop\temp_logo.png"

$bmp = New-Object System.Drawing.Bitmap($src)
$width = $bmp.Width
$height = $bmp.Height

$newBmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -gt 220 -and $p.G -gt 220 -and $p.B -gt 220) {
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, 229, 9, 20))
        }
    }
}

$bmp.Dispose()
if (Test-Path $tmpDest) { Remove-Item $tmpDest -Force }
$newBmp.Save($tmpDest, [System.Drawing.Imaging.ImageFormat]::Png)
$newBmp.Dispose()
Write-Host "SAVED_TO_TEMP"
