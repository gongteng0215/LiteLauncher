param([int]$ClickX, [int]$ClickY)
# Called only by the isolated popup smoke test over a dedicated inert window.
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class PopupPointerTest {
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X; public int Y; }
  [DllImport("user32.dll")] static extern bool GetCursorPos(out POINT point);
  [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
  public static void Click(int x, int y) {
    POINT original;
    GetCursorPos(out original);
    try { SetCursorPos(x, y); mouse_event(2, 0, 0, 0, UIntPtr.Zero); mouse_event(4, 0, 0, 0, UIntPtr.Zero); }
    finally { SetCursorPos(original.X, original.Y); }
  }
}
'@
[PopupPointerTest]::Click($ClickX, $ClickY)
