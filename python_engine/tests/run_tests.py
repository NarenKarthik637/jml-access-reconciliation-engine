"""
JML Access Guard - Academic & Technical Test Runner
Executes comprehensive regression and edge-case unit tests.
"""

import os
import sys
import unittest

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = loader.discover("python_engine/tests", pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
