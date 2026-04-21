import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const MAX_BUFFER_BYTES = 16 * 1024 * 1024;

export interface HardwareInspectorComputerSystem {
  name: string | null;
  manufacturer: string | null;
  model: string | null;
  systemType: string | null;
  totalPhysicalMemory: number | null;
}

export interface HardwareInspectorOperatingSystem {
  caption: string | null;
  version: string | null;
  buildNumber: string | null;
  architecture: string | null;
  lastBootUpTime: string | null;
  installDate: string | null;
}

export interface HardwareInspectorCpu {
  name: string | null;
  manufacturer: string | null;
  description: string | null;
  numberOfCores: number | null;
  numberOfLogicalProcessors: number | null;
  maxClockSpeed: number | null;
  currentClockSpeed: number | null;
  socketDesignation: string | null;
  addressWidth: number | null;
  dataWidth: number | null;
  processorId: string | null;
  architecture: string | null;
  virtualizationFirmwareEnabled: boolean | null;
  vmMonitorModeExtensions: boolean | null;
  secondLevelAddressTranslationExtensions: boolean | null;
  temperatureCelsius: number | null;
  temperatureSource: string | null;
}

export interface HardwareInspectorBaseBoard {
  manufacturer: string | null;
  product: string | null;
  version: string | null;
  serialNumber: string | null;
}

export interface HardwareInspectorBios {
  manufacturer: string | null;
  smbiosBiosVersion: string | null;
  version: string | null;
  releaseDate: string | null;
  serialNumber: string | null;
}

export interface HardwareInspectorMemoryModule {
  bankLabel: string | null;
  deviceLocator: string | null;
  manufacturer: string | null;
  partNumber: string | null;
  serialNumber: string | null;
  capacity: number | null;
  speed: number | null;
  configuredClockSpeed: number | null;
  formFactor: string | null;
  memoryType: string | null;
}

export interface HardwareInspectorGpu {
  name: string | null;
  manufacturer: string | null;
  adapterRam: number | null;
  driverVersion: string | null;
  driverDate: string | null;
  videoProcessor: string | null;
  horizontalResolution: number | null;
  verticalResolution: number | null;
  refreshRate: number | null;
  status: string | null;
  pnpDeviceId: string | null;
  temperatureCelsius: number | null;
  temperatureSource: string | null;
}

export interface HardwareInspectorVolume {
  deviceId: string | null;
  volumeName: string | null;
  fileSystem: string | null;
  size: number | null;
  freeSpace: number | null;
  driveType: number | null;
}

export interface HardwareInspectorPartition {
  index: number | null;
  name: string | null;
  type: string | null;
  size: number | null;
  bootPartition: boolean | null;
  primaryPartition: boolean | null;
  volumes: HardwareInspectorVolume[];
}

export interface HardwareInspectorDisk {
  index: number | null;
  deviceId: string | null;
  model: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
  interfaceType: string | null;
  mediaType: string | null;
  size: number | null;
  partitionCount: number | null;
  firmwareRevision: string | null;
  pnpDeviceId: string | null;
  storageMediaType: string | null;
  busType: string | null;
  healthStatus: string | null;
  operationalStatus: string | null;
  smartPredictFailure: boolean | null;
  smartReason: number | null;
  spindleSpeed: number | null;
  logicalSectorSize: number | null;
  physicalSectorSize: number | null;
  slotNumber: number | null;
  enclosureNumber: number | null;
  firmwareVersion: string | null;
  usage: string | null;
  canPool: boolean | null;
  temperatureCelsius: number | null;
  temperatureMaxCelsius: number | null;
  wearPercentage: number | null;
  powerOnHours: number | null;
  partitions: HardwareInspectorPartition[];
}

export interface HardwareInspectorSnapshot {
  collectedAt: string;
  computerSystem: HardwareInspectorComputerSystem;
  operatingSystem: HardwareInspectorOperatingSystem;
  cpus: HardwareInspectorCpu[];
  baseBoard: HardwareInspectorBaseBoard;
  bios: HardwareInspectorBios;
  memoryModules: HardwareInspectorMemoryModule[];
  gpus: HardwareInspectorGpu[];
  disks: HardwareInspectorDisk[];
}

const POWERSHELL_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding

function Get-SafeAssociatedInstances {
  param(
    [Parameter(Mandatory = $true)]
    $InputObject,
    [Parameter(Mandatory = $true)]
    [string]$Association
  )

  try {
    return @(Get-CimAssociatedInstance -InputObject $InputObject -Association $Association -ErrorAction Stop)
  } catch {
    return @()
  }
}

function Get-NormalizedMatchKey {
  param([string]$Value)

  if (-not $Value) {
    return $null
  }

  return (($Value.ToUpperInvariant()) -replace '[^A-Z0-9]', '')
}

function Get-NullableDouble {
  param($Value)

  try {
    if ($null -eq $Value -or $Value -eq '') {
      return $null
    }

    $number = [double]$Value
    if ([double]::IsNaN($number) -or [double]::IsInfinity($number)) {
      return $null
    }

    return $number
  } catch {
    return $null
  }
}

function Convert-TenthsKelvinToCelsius {
  param($Value)

  $number = Get-NullableDouble $Value
  if ($null -eq $number -or $number -le 0) {
    return $null
  }

  return [math]::Round(($number / 10.0) - 273.15, 1)
}

function Get-MatchKeywords {
  param([string]$Value)

  if (-not $Value) {
    return @()
  }

  return @(($Value -split '[^A-Za-z0-9]+' | Where-Object { $_ -and $_.Length -ge 3 } | Select-Object -Unique))
}

function Format-MonitorSensorSource {
  param($Sensor)

  if (-not $Sensor) {
    return $null
  }

  $parts = @($Sensor.SourceNamespace, $Sensor.Parent, $Sensor.Name) | Where-Object { $_ }
  if ($parts.Count -eq 0) {
    return $null
  }

  return ($parts -join ' / ')
}

function Find-MonitorTemperatureSensor {
  param(
    [object[]]$Sensors,
    [string[]]$Needles = @(),
    [string[]]$PreferredNeedles = @()
  )

  if (-not $Sensors -or $Sensors.Count -eq 0) {
    return $null
  }

  $matches = @()
  foreach ($sensor in $Sensors) {
    $haystack = (@($sensor.Parent, $sensor.Name, $sensor.Identifier) | Where-Object { $_ }) -join ' '
    $normalizedHaystack = Get-NormalizedMatchKey $haystack
    if (-not $normalizedHaystack) {
      continue
    }

    $matched = $Needles.Count -eq 0
    if (-not $matched) {
      foreach ($needle in $Needles) {
        $normalizedNeedle = Get-NormalizedMatchKey $needle
        if ($normalizedNeedle -and $normalizedHaystack.Contains($normalizedNeedle)) {
          $matched = $true
          break
        }
      }
    }

    if (-not $matched) {
      continue
    }

    $score = 0
    foreach ($preferred in $PreferredNeedles) {
      $normalizedPreferred = Get-NormalizedMatchKey $preferred
      if ($normalizedPreferred -and $normalizedHaystack.Contains($normalizedPreferred)) {
        $score += 10
      }
    }

    $value = Get-NullableDouble $sensor.Value
    if ($null -ne $value) {
      $score += [math]::Min([math]::Round($value), 200) / 100
    }

    $matches += [pscustomobject]@{
      Score = $score
      Sensor = $sensor
    }
  }

  if ($matches.Count -eq 0) {
    return $null
  }

  return ($matches |
    Sort-Object -Property @{ Expression = 'Score'; Descending = $true } |
    Select-Object -First 1).Sensor
}

$computerSystem = Get-CimInstance Win32_ComputerSystem |
  Select-Object Name, Manufacturer, Model, SystemType, TotalPhysicalMemory

$operatingSystem = Get-CimInstance Win32_OperatingSystem |
  Select-Object Caption, Version, BuildNumber, OSArchitecture, LastBootUpTime, InstallDate

$baseBoard = Get-CimInstance Win32_BaseBoard |
  Select-Object Manufacturer, Product, Version, SerialNumber

$bios = Get-CimInstance Win32_BIOS |
  Select-Object Manufacturer, SMBIOSBIOSVersion, Version, ReleaseDate, SerialNumber

$memoryModules = @(Get-CimInstance Win32_PhysicalMemory |
  Select-Object BankLabel, DeviceLocator, Manufacturer, PartNumber, SerialNumber,
    Capacity, Speed, ConfiguredClockSpeed, FormFactor, SMBIOSMemoryType)

try {
  $monitorTemperatureSensors = @()
  foreach ($sensorNamespace in @('root/LibreHardwareMonitor', 'root/OpenHardwareMonitor')) {
    try {
      $monitorTemperatureSensors += @(Get-CimInstance -Namespace $sensorNamespace -ClassName Sensor -ErrorAction Stop |
        Where-Object { $_.SensorType -eq 'Temperature' } |
        Select-Object @{ Name = 'SourceNamespace'; Expression = { $sensorNamespace } }, Name, Parent, Identifier, Value)
    } catch {
    }
  }
} catch {
  $monitorTemperatureSensors = @()
}

try {
  $acpiTemperatureZones = @(Get-CimInstance -Namespace 'root/wmi' -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop |
    Select-Object InstanceName, CurrentTemperature)
} catch {
  $acpiTemperatureZones = @()
}

$cpus = @()
foreach ($cpu in @(Get-CimInstance Win32_Processor |
  Select-Object Name, Manufacturer, Description, NumberOfCores, NumberOfLogicalProcessors,
    MaxClockSpeed, CurrentClockSpeed, SocketDesignation, AddressWidth, DataWidth,
    ProcessorId, Architecture, VirtualizationFirmwareEnabled,
    VMMonitorModeExtensions, SecondLevelAddressTranslationExtensions)) {
  $cpuNeedles = @('CPU', 'PACKAGE', 'TCTL', 'TDIE', 'CCD', 'CORE') + @(Get-MatchKeywords $cpu.Name)
  $cpuPreferred = @('CPU PACKAGE', 'TCTL', 'TDIE', 'CPU CCD', 'CCD1', 'CORE MAX')
  $cpuSensor = Find-MonitorTemperatureSensor -Sensors $monitorTemperatureSensors -Needles $cpuNeedles -PreferredNeedles $cpuPreferred

  $cpuTemperature = $null
  $cpuSource = $null
  if ($cpuSensor) {
    $cpuTemperature = Get-NullableDouble $cpuSensor.Value
    $cpuSource = Format-MonitorSensorSource $cpuSensor
  } elseif ($acpiTemperatureZones.Count -gt 0) {
    $zoneValues = @(
      $acpiTemperatureZones |
        ForEach-Object { Convert-TenthsKelvinToCelsius $_.CurrentTemperature } |
        Where-Object { $null -ne $_ }
    )
    if ($zoneValues.Count -gt 0) {
      $cpuTemperature = [math]::Round((($zoneValues | Measure-Object -Average).Average), 1)
      $cpuSource = 'ACPI Thermal Zone (best effort)'
    }
  }

  $cpus += [pscustomobject]@{
    Name = $cpu.Name
    Manufacturer = $cpu.Manufacturer
    Description = $cpu.Description
    NumberOfCores = $cpu.NumberOfCores
    NumberOfLogicalProcessors = $cpu.NumberOfLogicalProcessors
    MaxClockSpeed = $cpu.MaxClockSpeed
    CurrentClockSpeed = $cpu.CurrentClockSpeed
    SocketDesignation = $cpu.SocketDesignation
    AddressWidth = $cpu.AddressWidth
    DataWidth = $cpu.DataWidth
    ProcessorId = $cpu.ProcessorId
    Architecture = $cpu.Architecture
    VirtualizationFirmwareEnabled = $cpu.VirtualizationFirmwareEnabled
    VMMonitorModeExtensions = $cpu.VMMonitorModeExtensions
    SecondLevelAddressTranslationExtensions = $cpu.SecondLevelAddressTranslationExtensions
    TemperatureCelsius = $cpuTemperature
    TemperatureSource = $cpuSource
  }
}

$gpus = @()
foreach ($gpu in @(Get-CimInstance Win32_VideoController |
  Select-Object Name, AdapterCompatibility, AdapterRAM, DriverVersion, DriverDate,
    VideoProcessor, CurrentHorizontalResolution, CurrentVerticalResolution,
    CurrentRefreshRate, Status, PNPDeviceID)) {
  $gpuNeedles = @('GPU', 'GRAPHICS', 'HOTSPOT', 'EDGE') +
    @(Get-MatchKeywords $gpu.Name) +
    @(Get-MatchKeywords $gpu.AdapterCompatibility) +
    @(Get-MatchKeywords $gpu.VideoProcessor)
  $gpuPreferred = @('GPU CORE', 'GPU', 'HOTSPOT', 'EDGE') + @(Get-MatchKeywords $gpu.Name)
  $gpuSensor = Find-MonitorTemperatureSensor -Sensors $monitorTemperatureSensors -Needles $gpuNeedles -PreferredNeedles $gpuPreferred

  $gpus += [pscustomobject]@{
    Name = $gpu.Name
    AdapterCompatibility = $gpu.AdapterCompatibility
    AdapterRAM = $gpu.AdapterRAM
    DriverVersion = $gpu.DriverVersion
    DriverDate = $gpu.DriverDate
    VideoProcessor = $gpu.VideoProcessor
    CurrentHorizontalResolution = $gpu.CurrentHorizontalResolution
    CurrentVerticalResolution = $gpu.CurrentVerticalResolution
    CurrentRefreshRate = $gpu.CurrentRefreshRate
    Status = $gpu.Status
    PNPDeviceID = $gpu.PNPDeviceID
    TemperatureCelsius = if ($gpuSensor) { Get-NullableDouble $gpuSensor.Value } else { $null }
    TemperatureSource = if ($gpuSensor) { Format-MonitorSensorSource $gpuSensor } else { $null }
  }
}

try {
  $physicalDisks = @(Get-CimInstance -Namespace 'root/Microsoft/Windows/Storage' -ClassName MSFT_PhysicalDisk -ErrorAction Stop |
    Select-Object FriendlyName, SerialNumber, MediaType, BusType, Size, HealthStatus,
      OperationalStatus, SlotNumber, EnclosureNumber, FirmwareVersion, SpindleSpeed,
      LogicalSectorSize, PhysicalSectorSize, Usage, CanPool)
} catch {
  $physicalDisks = @()
}

try {
  $smartStatuses = @(Get-CimInstance -Namespace 'root/wmi' -ClassName MSStorageDriver_FailurePredictStatus -ErrorAction Stop |
    Select-Object InstanceName, PredictFailure, Reason)
} catch {
  $smartStatuses = @()
}

try {
  $reliabilityCounters = @(Get-PhysicalDisk | Get-StorageReliabilityCounter -ErrorAction Stop |
    Select-Object DeviceId, Temperature, TemperatureMax, Wear, PowerOnHours)
} catch {
  $reliabilityCounters = @()
}

$disks = @()
foreach ($disk in @(Get-CimInstance Win32_DiskDrive | Sort-Object Index)) {
  $partitionItems = @()
  foreach ($partition in @(Get-SafeAssociatedInstances -InputObject $disk -Association 'Win32_DiskDriveToDiskPartition' | Sort-Object Index)) {
    $volumeItems = @()
    foreach ($volume in @(Get-SafeAssociatedInstances -InputObject $partition -Association 'Win32_LogicalDiskToPartition' | Sort-Object DeviceID)) {
      $volumeItems += [pscustomobject]@{
        deviceId = $volume.DeviceID
        volumeName = $volume.VolumeName
        fileSystem = $volume.FileSystem
        size = $volume.Size
        freeSpace = $volume.FreeSpace
        driveType = $volume.DriveType
      }
    }

    $partitionItems += [pscustomobject]@{
      index = $partition.Index
      name = $partition.Name
      type = $partition.Type
      size = $partition.Size
      bootPartition = $partition.BootPartition
      primaryPartition = $partition.PrimaryPartition
      volumes = $volumeItems
    }
  }

  $storageMatch = $null
  foreach ($physicalDisk in $physicalDisks) {
    $sameSerial = ($physicalDisk.SerialNumber -as [string]) -and ($disk.SerialNumber -as [string]) -and (($physicalDisk.SerialNumber -as [string]).Trim() -eq ($disk.SerialNumber -as [string]).Trim())
    $sameName = ($physicalDisk.FriendlyName -as [string]) -and ($disk.Model -as [string]) -and (
      ($physicalDisk.FriendlyName -as [string]).Trim() -eq ($disk.Model -as [string]).Trim()
    )
    $sameSize = ($physicalDisk.Size -as [uint64]) -and ($disk.Size -as [uint64]) -and (($physicalDisk.Size -as [uint64]) -eq ($disk.Size -as [uint64]))

    if ($sameSerial -or ($sameName -and $sameSize)) {
      $storageMatch = $physicalDisk
      break
    }
  }

  $smartMatch = $null
  $diskPnpKey = Get-NormalizedMatchKey ($disk.PNPDeviceID -as [string])
  $diskSerialKey = Get-NormalizedMatchKey ($disk.SerialNumber -as [string])
  $diskModelKey = Get-NormalizedMatchKey ($disk.Model -as [string])
  foreach ($smartStatus in $smartStatuses) {
    $instanceKey = Get-NormalizedMatchKey ($smartStatus.InstanceName -as [string])
    if (-not $instanceKey) {
      continue
    }

    $matchesPnp = $diskPnpKey -and $instanceKey.Contains($diskPnpKey)
    $matchesSerial = $diskSerialKey -and $instanceKey.Contains($diskSerialKey)
    $matchesModel = $diskModelKey -and $instanceKey.Contains($diskModelKey)
    if ($matchesPnp -or $matchesSerial -or $matchesModel) {
      $smartMatch = $smartStatus
      break
    }
  }

  $reliabilityMatch = $null
  if ($storageMatch -and $null -ne $storageMatch.DeviceId) {
    foreach ($reliabilityCounter in $reliabilityCounters) {
      if (($reliabilityCounter.DeviceId -as [string]) -eq ($storageMatch.DeviceId -as [string])) {
        $reliabilityMatch = $reliabilityCounter
        break
      }
    }
  }

  $disks += [pscustomobject]@{
    index = $disk.Index
    deviceId = $disk.DeviceID
    model = $disk.Model
    manufacturer = $disk.Manufacturer
    serialNumber = $disk.SerialNumber
    interfaceType = $disk.InterfaceType
    mediaType = $disk.MediaType
    size = $disk.Size
    partitionCount = $disk.Partitions
    firmwareRevision = $disk.FirmwareRevision
    pnpDeviceId = $disk.PNPDeviceID
    storageMediaType = if ($storageMatch) { $storageMatch.MediaType } else { $null }
    busType = if ($storageMatch) { $storageMatch.BusType } else { $null }
    healthStatus = if ($storageMatch) { $storageMatch.HealthStatus } else { $null }
    operationalStatus = if ($storageMatch) { $storageMatch.OperationalStatus } else { $null }
    smartPredictFailure = if ($smartMatch) { $smartMatch.PredictFailure } else { $null }
    smartReason = if ($smartMatch) { $smartMatch.Reason } else { $null }
    spindleSpeed = if ($storageMatch) { $storageMatch.SpindleSpeed } else { $null }
    logicalSectorSize = if ($storageMatch) { $storageMatch.LogicalSectorSize } else { $null }
    physicalSectorSize = if ($storageMatch) { $storageMatch.PhysicalSectorSize } else { $null }
    slotNumber = if ($storageMatch) { $storageMatch.SlotNumber } else { $null }
    enclosureNumber = if ($storageMatch) { $storageMatch.EnclosureNumber } else { $null }
    firmwareVersion = if ($storageMatch) { $storageMatch.FirmwareVersion } else { $null }
    usage = if ($storageMatch) { $storageMatch.Usage } else { $null }
    canPool = if ($storageMatch) { $storageMatch.CanPool } else { $null }
    temperatureCelsius = if ($reliabilityMatch) { $reliabilityMatch.Temperature } else { $null }
    temperatureMaxCelsius = if ($reliabilityMatch) { $reliabilityMatch.TemperatureMax } else { $null }
    wearPercentage = if ($reliabilityMatch) { $reliabilityMatch.Wear } else { $null }
    powerOnHours = if ($reliabilityMatch) { $reliabilityMatch.PowerOnHours } else { $null }
    partitions = $partitionItems
  }
}

$json = [pscustomobject]@{
  collectedAt = (Get-Date).ToString('o')
  computerSystem = $computerSystem
  operatingSystem = $operatingSystem
  cpus = $cpus
  baseBoard = $baseBoard
  bios = $bios
  memoryModules = $memoryModules
  gpus = $gpus
  disks = $disks
} | ConvertTo-Json -Depth 8 -Compress

[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))
`;

function getPowerShellPath(): string {
  const systemRoot = process.env.SystemRoot || "C:\\Windows";
  return path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const next = value.trim();
  if (!next) {
    return null;
  }

  const lowered = next.toLowerCase();
  const placeholders = new Set([
    "to be filled by o.e.m.",
    "default string",
    "system product name",
    "system version",
    "not applicable",
    "none",
    "unknown"
  ]);
  if (placeholders.has(lowered)) {
    return null;
  }

  return next;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toNullableBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  return null;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toRecordList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item)
  );
}

function normalizeCpuArchitecture(value: unknown): string | null {
  const raw = toNullableNumber(value);
  switch (raw) {
    case 0:
      return "x86";
    case 5:
      return "ARM";
    case 9:
      return "x64";
    case 12:
      return "ARM64";
    default:
      return cleanText(typeof value === "string" ? value : "");
  }
}

function normalizeFormFactor(value: unknown): string | null {
  const raw = toNullableNumber(value);
  switch (raw) {
    case 8:
      return "DIMM";
    case 12:
      return "SODIMM";
    case 13:
      return "SRIMM";
    default:
      return raw === null ? null : String(raw);
  }
}

function normalizeMemoryType(value: unknown): string | null {
  const raw = toNullableNumber(value);
  switch (raw) {
    case 20:
      return "DDR";
    case 21:
      return "DDR2";
    case 24:
      return "DDR3";
    case 26:
      return "DDR4";
    case 34:
      return "DDR5";
    default:
      return raw === null ? null : String(raw);
  }
}

function normalizeStorageMediaType(value: unknown, fallback: unknown): string | null {
  const raw = toNullableNumber(value);
  switch (raw) {
    case 3:
      return "HDD";
    case 4:
      return "SSD";
    case 5:
      return "SCM";
    case 6:
      return "NVMe";
    default:
      return cleanText(typeof fallback === "string" ? fallback : "");
  }
}

function normalizeBusType(value: unknown): string | null {
  const raw = toNullableNumber(value);
  switch (raw) {
    case 3:
      return "SATA";
    case 7:
      return "USB";
    case 11:
      return "SAS";
    case 17:
      return "NVMe";
    default:
      return cleanText(typeof value === "string" ? value : "");
  }
}

function normalizeHealthStatus(value: unknown): string | null {
  const raw = toNullableNumber(value);
  switch (raw) {
    case 0:
      return "鏈煡";
    case 1:
      return "鍋ュ悍";
    case 2:
      return "璀﹀憡";
    case 3:
      return "鏁呴殰";
    default: {
      const text = cleanText(typeof value === "string" ? value : "");
      if (!text) {
        return null;
      }
      const lowered = text.toLowerCase();
      if (lowered.includes("healthy")) {
        return "鍋ュ悍";
      }
      if (lowered.includes("warning")) {
        return "璀﹀憡";
      }
      if (lowered.includes("unhealthy") || lowered.includes("error")) {
        return "鏁呴殰";
      }
      return text;
    }
  }
}

function normalizeOperationalStatus(value: unknown): string | null {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => normalizeOperationalStatus(item))
      .filter((item): item is string => Boolean(item));
    return items.length > 0 ? items.join(" / ") : null;
  }

  const raw = toNullableNumber(value);
  switch (raw) {
    case 0:
      return "鏈煡";
    case 2:
      return "姝ｅ父";
    case 3:
      return "闄嶇骇";
    case 4:
      return "鍘嬪姏";
    case 5:
      return "棰勬祴鏁呴殰";
    case 6:
      return "閿欒";
    case 7:
      return "涓嶅彲鎭㈠閿欒";
    case 8:
      return "鍚姩涓?";
    case 9:
      return "鍋滄涓?";
    case 10:
      return "宸插仠姝?";
    case 14:
      return "宸蹭腑姝?";
    case 15:
      return "浼戠湢";
    case 17:
      return "宸插畬鎴?";
    default:
      return cleanText(typeof value === "string" ? value : raw === null ? "" : String(raw));
  }
}

function normalizeStorageUsage(value: unknown): string | null {
  const raw = toNullableNumber(value);
  switch (raw) {
    case 1:
      return "鑷姩";
    case 2:
      return "鎵嬪姩";
    case 3:
      return "鐑";
    case 4:
      return "閫€褰?";
    case 5:
      return "鏃ュ織";
    default:
      return cleanText(typeof value === "string" ? value : raw === null ? "" : String(raw));
  }
}

function normalizeSpindleSpeed(value: unknown): number | null {
  const raw = toNullableNumber(value);
  if (raw === null || raw <= 0 || raw >= 4294967295) {
    return null;
  }

  return raw;
}

function normalizeTemperature(value: unknown): number | null {
  const raw = toNullableNumber(value);
  if (raw === null || raw <= 0 || raw >= 1000) {
    return null;
  }

  return raw;
}

function normalizeWearPercentage(value: unknown): number | null {
  const raw = toNullableNumber(value);
  if (raw === null || raw < 0 || raw > 100) {
    return null;
  }

  return raw;
}

function normalizeSnapshot(raw: Record<string, unknown>): HardwareInspectorSnapshot {
  const computerSystem = toRecord(raw.computerSystem);
  const operatingSystem = toRecord(raw.operatingSystem);
  const baseBoard = toRecord(raw.baseBoard);
  const bios = toRecord(raw.bios);

  return {
    collectedAt: cleanText(raw.collectedAt) ?? new Date().toISOString(),
    computerSystem: {
      name: cleanText(computerSystem.Name),
      manufacturer: cleanText(computerSystem.Manufacturer),
      model: cleanText(computerSystem.Model),
      systemType: cleanText(computerSystem.SystemType),
      totalPhysicalMemory: toNullableNumber(computerSystem.TotalPhysicalMemory)
    },
    operatingSystem: {
      caption: cleanText(operatingSystem.Caption),
      version: cleanText(operatingSystem.Version),
      buildNumber: cleanText(operatingSystem.BuildNumber),
      architecture: cleanText(operatingSystem.OSArchitecture),
      lastBootUpTime: cleanText(operatingSystem.LastBootUpTime),
      installDate: cleanText(operatingSystem.InstallDate)
    },
    cpus: toRecordList(raw.cpus).map((item) => ({
      name: cleanText(item.Name),
      manufacturer: cleanText(item.Manufacturer),
      description: cleanText(item.Description),
      numberOfCores: toNullableNumber(item.NumberOfCores),
      numberOfLogicalProcessors: toNullableNumber(item.NumberOfLogicalProcessors),
      maxClockSpeed: toNullableNumber(item.MaxClockSpeed),
      currentClockSpeed: toNullableNumber(item.CurrentClockSpeed),
      socketDesignation: cleanText(item.SocketDesignation),
      addressWidth: toNullableNumber(item.AddressWidth),
      dataWidth: toNullableNumber(item.DataWidth),
      processorId: cleanText(item.ProcessorId),
      architecture: normalizeCpuArchitecture(item.Architecture),
      virtualizationFirmwareEnabled: toNullableBoolean(item.VirtualizationFirmwareEnabled),
      vmMonitorModeExtensions: toNullableBoolean(item.VMMonitorModeExtensions),
      secondLevelAddressTranslationExtensions: toNullableBoolean(
        item.SecondLevelAddressTranslationExtensions
      ),
      temperatureCelsius: normalizeTemperature(item.TemperatureCelsius),
      temperatureSource: cleanText(item.TemperatureSource)
    })),
    baseBoard: {
      manufacturer: cleanText(baseBoard.Manufacturer),
      product: cleanText(baseBoard.Product),
      version: cleanText(baseBoard.Version),
      serialNumber: cleanText(baseBoard.SerialNumber)
    },
    bios: {
      manufacturer: cleanText(bios.Manufacturer),
      smbiosBiosVersion: cleanText(bios.SMBIOSBIOSVersion),
      version: cleanText(bios.Version),
      releaseDate: cleanText(bios.ReleaseDate),
      serialNumber: cleanText(bios.SerialNumber)
    },
    memoryModules: toRecordList(raw.memoryModules).map((item) => ({
      bankLabel: cleanText(item.BankLabel),
      deviceLocator: cleanText(item.DeviceLocator),
      manufacturer: cleanText(item.Manufacturer),
      partNumber: cleanText(item.PartNumber),
      serialNumber: cleanText(item.SerialNumber),
      capacity: toNullableNumber(item.Capacity),
      speed: toNullableNumber(item.Speed),
      configuredClockSpeed: toNullableNumber(item.ConfiguredClockSpeed),
      formFactor: normalizeFormFactor(item.FormFactor),
      memoryType: normalizeMemoryType(item.SMBIOSMemoryType)
    })),
    gpus: toRecordList(raw.gpus).map((item) => ({
      name: cleanText(item.Name),
      manufacturer: cleanText(item.AdapterCompatibility),
      adapterRam: toNullableNumber(item.AdapterRAM),
      driverVersion: cleanText(item.DriverVersion),
      driverDate: cleanText(item.DriverDate),
      videoProcessor: cleanText(item.VideoProcessor),
      horizontalResolution: toNullableNumber(item.CurrentHorizontalResolution),
      verticalResolution: toNullableNumber(item.CurrentVerticalResolution),
      refreshRate: toNullableNumber(item.CurrentRefreshRate),
      status: cleanText(item.Status),
      pnpDeviceId: cleanText(item.PNPDeviceID),
      temperatureCelsius: normalizeTemperature(item.TemperatureCelsius),
      temperatureSource: cleanText(item.TemperatureSource)
    })),
    disks: toRecordList(raw.disks).map((item) => ({
      index: toNullableNumber(item.index),
      deviceId: cleanText(item.deviceId),
      model: cleanText(item.model),
      manufacturer: cleanText(item.manufacturer),
      serialNumber: cleanText(item.serialNumber),
      interfaceType: cleanText(item.interfaceType),
      mediaType: normalizeStorageMediaType(item.storageMediaType, item.mediaType),
      size: toNullableNumber(item.size),
      partitionCount: toNullableNumber(item.partitionCount),
      firmwareRevision: cleanText(item.firmwareRevision),
      pnpDeviceId: cleanText(item.pnpDeviceId),
      storageMediaType: normalizeStorageMediaType(item.storageMediaType, item.mediaType),
      busType: normalizeBusType(item.busType),
      healthStatus: normalizeHealthStatus(item.healthStatus),
      operationalStatus: normalizeOperationalStatus(item.operationalStatus),
      smartPredictFailure: toNullableBoolean(item.smartPredictFailure),
      smartReason: toNullableNumber(item.smartReason),
      spindleSpeed: normalizeSpindleSpeed(item.spindleSpeed),
      logicalSectorSize: toNullableNumber(item.logicalSectorSize),
      physicalSectorSize: toNullableNumber(item.physicalSectorSize),
      slotNumber: toNullableNumber(item.slotNumber),
      enclosureNumber: toNullableNumber(item.enclosureNumber),
      firmwareVersion: cleanText(item.firmwareVersion),
      usage: normalizeStorageUsage(item.usage),
      canPool: toNullableBoolean(item.canPool),
      temperatureCelsius: normalizeTemperature(item.temperatureCelsius),
      temperatureMaxCelsius: normalizeTemperature(item.temperatureMaxCelsius),
      wearPercentage: normalizeWearPercentage(item.wearPercentage),
      powerOnHours: toNullableNumber(item.powerOnHours),
      partitions: toRecordList(item.partitions).map((partition) => ({
        index: toNullableNumber(partition.index),
        name: cleanText(partition.name),
        type: cleanText(partition.type),
        size: toNullableNumber(partition.size),
        bootPartition: toNullableBoolean(partition.bootPartition),
        primaryPartition: toNullableBoolean(partition.primaryPartition),
        volumes: toRecordList(partition.volumes).map((volume) => ({
          deviceId: cleanText(volume.deviceId),
          volumeName: cleanText(volume.volumeName),
          fileSystem: cleanText(volume.fileSystem),
          size: toNullableNumber(volume.size),
          freeSpace: toNullableNumber(volume.freeSpace),
          driveType: toNullableNumber(volume.driveType)
        }))
      }))
    }))
  };
}

export async function collectHardwareInspectorSnapshot(): Promise<HardwareInspectorSnapshot> {
  const powerShellPath = getPowerShellPath();
  const scriptPath = path.join(
    os.tmpdir(),
    `litelauncher-hardware-${process.pid}-${Date.now()}-${Math.round(Math.random() * 1e9)}.ps1`
  );

  await fs.writeFile(scriptPath, POWERSHELL_SCRIPT, "utf8");

  let stdout: Buffer | string = Buffer.alloc(0);
  try {
    const result = await execFileAsync(
      powerShellPath,
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
      {
        encoding: "buffer",
        windowsHide: true,
        maxBuffer: MAX_BUFFER_BYTES
      }
    );
    stdout = result.stdout;
  } finally {
    await fs.rm(scriptPath, { force: true }).catch(() => undefined);
  }

  const encodedText = Buffer.isBuffer(stdout)
    ? stdout.toString("utf8").trim()
    : String(stdout).trim();
  if (!encodedText) {
    throw new Error("硬件信息采集为空");
  }

  const text = Buffer.from(encodedText, "base64").toString("utf8").trim();
  const parsed = JSON.parse(text) as Record<string, unknown>;
  return normalizeSnapshot(parsed);
}

