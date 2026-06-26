{
  "targets": [
    {
      "target_name": "litesnap_capture",
      "sources": [
        "src/addon.cc"
      ],
      "libraries": [
        "-lgdi32",
        "-luser32"
      ],
      "win_delay_load_hook": "true"
    }
  ]
}
