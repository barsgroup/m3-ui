# coding:utf-8

import sys
import os
import codecs
import subprocess

import conf

DEBUG = False

def add_file(src_file, dst_files, folder):
    """
    Добавляет к файлу файлы из папки
    @attr src_file Исходный файл
    @attr dst_files Файлы, которые необходимо добавить
    @attr folder Папка откуда добавляются файлы
    """
    for ffile in dst_files:
        if ffile not in conf.EXCLUDE:             
            file_names = ffile.split('.')
            if len(file_names) > 0 and file_names[-1] in conf.FILE_EXTENSIONS:
                if DEBUG:   
                    print ffile
                            
                file_path = os.path.join(folder, ffile)

                try:
                    with codecs.open(file_path, 'r', encoding='utf-8') as f:
                        src_file.write(f.read())
                        src_file.write('\n')
                except IOError:
                    continue

def compile_production(src_file):
    """
    Компиляция google closure
    """
    new_file_name = os.path.join(conf.INNER_JS_FOLDER, conf.FILE_NAME_OPT) 
    command = ('java -jar compiler.jar --js %s --js_output_file %s' %
        (src_file, new_file_name))
    popen = subprocess.Popen(command, shell = True,)
    popen.wait()

def main():
    """
    Основная функция
    """
    def add_inner_files(src_file, priority_file_list):
        """
        Добавляет файлы в подпапки static/m3/js
        """
        # NOTE(Excinsky): Здесь нужно проходить по всем папкам даже для
        # одного приоритетного файла, так как внутри списка приоритетных файлов
        # тоже есть приоритеты, вот досада.
        # По хорошему это нужно вынести на разные уровни приоритетов,
        # но пока особой необходимости нет.
        for file_ in priority_file_list:
            add_file(src_file, [file_,], conf.OUR_EXTJS_EXTENSIONS_FOLDER)
            add_file(src_file, [file_,], conf.OUR_OTHER_JS_FOLDER)


    new_file_name = os.path.join(conf.INNER_JS_FOLDER, conf.FILE_NAME)
    with codecs.open(new_file_name, 'w+', encoding='utf-8',
                     buffering=0) as new_file:
        
        # Файлы, приоритеты которых не заданы будут перебираться в алфавитном
        # порядке с помощью функции sorted
        
        # Загрузка внешних файлов c высоким приоритетом
        add_file(new_file, conf.HIGH_PRIORITY_OUTER, conf.OUTER_JS_FOLDER)

        
        # Загрузка остальных внешних файлов
        add_file(new_file, [f for f in sorted(os.listdir(conf.OUTER_JS_FOLDER)) 
                            if f not in conf.HIGH_PRIORITY_OUTER],
                 conf.OUTER_JS_FOLDER)

        # NOTE(Excinsky): Тут будут возникать проблемы, если в каждой из
        # двух или более подпапках static/m3/js окажутся файлы с одинаковыми
        # названиями. Но так как доселе такого еще не было, я не стал писать
        # защитный код на такой случай.
        
        # Загрузка внутренних файлов с высоким приоритетом
        file_list_high_priority = conf.HIGH_PRIORITY
        add_inner_files(new_file, file_list_high_priority)

        # Загрузка внутренних файлов со средним приоритетом
        file_list_middle_priority = \
            [f for f in
                sorted(os.listdir(conf.OUR_EXTJS_EXTENSIONS_FOLDER)) +
                sorted(os.listdir(conf.OUR_OTHER_JS_FOLDER))
             if f not in conf.HIGH_PRIORITY and f not in conf.LOW_PRIORITY]
        add_inner_files(new_file, file_list_middle_priority)
    
        # Загрузка внутренних файлов с низким приоритетом
        file_list_low_priority = conf.LOW_PRIORITY
        add_inner_files(new_file, file_list_low_priority)
        
    if not DEBUG:
        compile_production(new_file_name)

if __name__ == '__main__':
    
    if len(sys.argv) > 1 and sys.argv[1] == '--debug':
        DEBUG = True 
    
    main()
    print "Job done"