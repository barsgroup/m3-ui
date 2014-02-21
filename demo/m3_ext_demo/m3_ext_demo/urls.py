# coding: utf-8

from django.conf.urls import patterns
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import render_to_response

from m3_ext_demo import urlpatterns_module

urlpatterns = patterns('',
                       (r'^$', lambda request: render_to_response('master.html'))
) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += patterns('', *urlpatterns_module)