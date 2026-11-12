cmake_minimum_required(VERSION 3.20)
project(game_content_validator LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(validator src/validator.cpp)
target_include_directories(validator PUBLIC include)

add_executable(game-content-validator src/main.cpp)
target_link_libraries(game-content-validator PRIVATE validator)

enable_testing()
add_executable(validator-tests tests/test_validator.cpp)
target_link_libraries(validator-tests PRIVATE validator)
add_test(NAME validator-tests COMMAND validator-tests)
