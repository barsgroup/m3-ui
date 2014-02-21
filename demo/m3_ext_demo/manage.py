#!/usr/bin/env python
import os
import sys

m3_ext_path = os.path.abspath(os.path.join('..', '..', 'src',))
sys.path.append(m3_ext_path)

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "m3_ext_demo.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
