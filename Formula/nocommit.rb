require "language/node"

class Nocommit < Formula
  desc "AI-powered CLI that writes your git commit messages using Google Gemini"
  homepage "https://github.com/asimar007/no-commit"
  url "https://registry.npmjs.org/nocommit/-/nocommit-1.0.1.tgz"
  sha256 "e58a465bd3ab86e7d7a81012d20238380f7c4ccfac3bdc40b93877dcb97becf7"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/nocommit --version")
  end
end
