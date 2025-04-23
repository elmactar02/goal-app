
$URL= minikube service myservice --url

Write-Output $URL

$env:IP_backend = $URL

Write-Output $env:IP_backend